import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { baseApi } from "@/redux/services/base-api";
import { useGetSchoolCreationJobQuery } from "@/redux/services/dashboard/school-mgt-api";
import type { SchoolCreationJob } from "@/redux/services/dashboard/school-types";
import { routesPath } from "@/routes/routes-path";
import {
  STEP_REVEAL_MS,
  creationPhase,
  progressFraction,
  stepLabel,
  stepStates,
  type StepState,
} from "./school-creation-steps";

const POLL_MS = 600;
/** A job still queued after this long gets a note that the server is busy. */
const SLOW_QUEUE_MS = 20_000;
/** With the POST lost in transit, how long to look for the job before saying so. */
const LOST_AFTER_MS = 15_000;

interface SchoolCreationDialogProps {
  /** The school being created, as typed; the job names it once it exists. */
  schoolName: string;
  /** The job's id, generated here before posting so polling starts at once. */
  jobId: string | undefined;
  /** The job as the POST answered it. Terminal already when the job ran inline. */
  postedJob: SchoolCreationJob | undefined;
  /** The POST got no HTTP answer, so the job may or may not exist. */
  postLost: boolean;
  /** Closes the box and returns to the form, its answers intact. */
  onBackToForm: () => void;
}

/**
 * The box shown while a school is created.
 *
 * Creating a school is a background job on the server. This polls the job and
 * lists its steps as it reports them: finished ones ticked, the running one
 * spinning, the rest waiting, and the bar filling with them. Every tick is a
 * step the server has finished; the reveal is paced so a fast creation is
 * still seen happening, but nothing is ever shown done before it is.
 *
 * It cannot be dismissed while the job runs. When the job succeeds the box
 * becomes the confirmation and the school list is refreshed; when it fails it
 * names the step it stopped on and why, and nothing was saved. When the POST
 * itself got no answer, the job is looked for by its id before the box gives
 * up, because a request lost on the way back may still have created the school.
 */
export default function SchoolCreationDialog({
  schoolName,
  jobId,
  postedJob,
  postLost,
  onBackToForm,
}: SchoolCreationDialogProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // The first finished answer is kept here, and polling stops for good: a
  // skipped query drops its data, so the answer cannot stay in the cache.
  const [finalJob, setFinalJob] = useState<SchoolCreationJob>();
  const { data: polled } = useGetSchoolCreationJobQuery(
    jobId && !finalJob ? jobId : skipToken,
    { pollingInterval: POLL_MS, skipPollingIfUnfocused: false },
  );
  const latest = isTerminal(postedJob) ? postedJob : polled?.data ?? postedJob;
  if (!finalJob && isTerminal(latest)) setFinalJob(latest);
  const job = finalJob ?? latest;
  const terminal = isTerminal(job);

  // Finished steps are revealed one at a time, never ahead of the server.
  const [revealed, setRevealed] = useState(0);
  const finished = job?.done.length ?? 0;
  useEffect(() => {
    if (revealed >= finished) return;
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), STEP_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [revealed, finished]);

  const phase = creationPhase(job, revealed);

  // Refresh every list that shows schools, once, when this one exists.
  useEffect(() => {
    if (phase === "succeeded") dispatch(baseApi.util.invalidateTags(["Schools"]));
  }, [phase, dispatch]);

  const [slowQueue, setSlowQueue] = useState(false);
  const queued = job?.status === "QUEUED";
  useEffect(() => {
    if (!queued) return;
    const timer = window.setTimeout(() => setSlowQueue(true), SLOW_QUEUE_MS);
    return () => window.clearTimeout(timer);
  }, [queued]);

  const [lost, setLost] = useState(false);
  const searching = postLost && !job;
  useEffect(() => {
    if (!searching) return;
    const timer = window.setTimeout(() => setLost(true), LOST_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [searching]);

  const label = job?.school?.label || schoolName || "the school";
  const fraction = phase === "succeeded" ? 1 : progressFraction(job, revealed);
  const rows = job ? stepStates(job, revealed) : [];
  const showLost = searching && lost;
  const failed = phase === "failed" || showLost;

  const goToList = () =>
    navigate(routesPath.PROTECTED.SCHOOL_MGT.INDEX + "?status=pending", { replace: true });

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => { if (!terminal && !showLost) event.preventDefault(); }}
        onInteractOutside={(event) => event.preventDefault()}
        className="w-full sm:max-w-md rounded-xl p-0 overflow-hidden"
        data-guide="school-create.progress"
      >
        <div className="px-6 pt-6">
          <DialogHeader className="gap-1.5 text-left">
            <div className="flex items-center gap-3">
              <PhaseIcon phase={showLost ? "failed" : phase} />
              <DialogTitle className="font-mont text-base font-semibold text-black-01">
                {phase === "succeeded"
                  ? `${label} is ready`
                  : showLost
                    ? `Could not confirm ${label}`
                    : failed
                      ? `${label} was not created`
                      : `Setting up ${label}`}
              </DialogTitle>
            </div>
            <DialogDescription className="font-mont text-xs text-gray-01" aria-live="polite">
              {headline({ phase, job, slowQueue, showLost, searching })}
            </DialogDescription>
          </DialogHeader>

          <div
            className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-03"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500 ease-out",
                failed ? "bg-error" : phase === "succeeded" ? "bg-green-01" : "bg-primary",
                phase === "starting" && !failed && "w-1/4 animate-pulse",
              )}
              style={
                phase === "starting" && !failed
                  ? undefined
                  : { width: `${fraction > 0 || !failed ? Math.max(fraction * 100, 4) : 0}%` }
              }
            />
          </div>
        </div>

        {(rows.length > 0 || !failed) && (
          <ol className="mt-4 max-h-[50dvh] space-y-0.5 overflow-y-auto px-6" aria-label="Setup steps">
            {rows.length === 0 && <StepRow state="current" text="Checking the details" />}
            {rows.map(({ step, state }) => (
              <StepRow key={step} state={state} text={stepLabel(step)} />
            ))}
          </ol>
        )}

        {failed && (
          <p role="alert" className="mx-6 mt-4 rounded-md bg-error/10 px-3 py-2.5 font-mont text-xs text-error-text">
            {showLost
              ? "The server did not answer, so this screen cannot tell whether the school was created. Check School Onboarding before trying again, or you may create it twice."
              : job?.message || "The school could not be created, and nothing was saved."}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white-02 bg-white-05 px-6 py-4 sm:flex-row sm:justify-end">
          {phase === "succeeded" && job?.school && (
            <>
              <Button variant="outline" onClick={goToList}>
                Go to School Onboarding
              </Button>
              <Button
                onClick={() =>
                  navigate(routesPath.PROTECTED.SCHOOL_MGT.VIEW(job.school!.slug), { replace: true })
                }
              >
                Open the school
              </Button>
            </>
          )}
          {failed && (
            <>
              {showLost && (
                <Button variant="outline" onClick={goToList}>
                  Check School Onboarding
                </Button>
              )}
              <Button onClick={onBackToForm}>Back to the form</Button>
            </>
          )}
          {!failed && phase !== "succeeded" && (
            <p className="font-mont text-xs text-gray-01 sm:mr-auto">
              The school keeps being set up even if you leave this page.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isTerminal(job: SchoolCreationJob | undefined): job is SchoolCreationJob {
  return job?.status === "SUCCEEDED" || job?.status === "FAILED" || job?.status === "CANCELLED";
}

function headline({
  phase,
  job,
  slowQueue,
  showLost,
  searching,
}: {
  phase: ReturnType<typeof creationPhase>;
  job: SchoolCreationJob | undefined;
  slowQueue: boolean;
  showLost: boolean;
  searching: boolean;
}): string {
  if (showLost) return "The request did not get an answer.";
  if (phase === "succeeded") {
    return job?.steps.includes("invitations")
      ? "Everything is set up, and the invitation emails are queued for the administrators."
      : "Everything is set up.";
  }
  if (phase === "failed") return "It stopped before finishing, so none of it was kept.";
  if (searching) return "Reconnecting to see how far it got…";
  if (slowQueue) return "Waiting for the server to start. It is busy, so this can take a moment.";
  return "This takes a few seconds. Each step is ticked as the server finishes it.";
}

function PhaseIcon({ phase }: { phase: ReturnType<typeof creationPhase> }) {
  if (phase === "succeeded") {
    return (
      <span className="grid size-8 shrink-0 place-content-center rounded-full bg-green-01/10 text-green-01-text">
        <Check className="size-4.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (phase === "failed") {
    return (
      <span className="grid size-8 shrink-0 place-content-center rounded-full bg-error/10 text-error-text">
        <CircleAlert className="size-4.5" />
      </span>
    );
  }
  return (
    <span className="grid size-8 shrink-0 place-content-center rounded-full bg-primary/10 text-primary">
      <Loader2 className="size-4.5 animate-spin" />
    </span>
  );
}

function StepRow({ state, text }: { state: StepState; text: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-300",
        state === "current" && "bg-primary/5",
        state === "failed" && "bg-error/5",
      )}
      aria-current={state === "current" ? "step" : undefined}
    >
      <StepMark state={state} />
      <span
        className={cn(
          "min-w-0 font-mont text-sm transition-colors duration-300",
          state === "done" && "text-black-01",
          state === "current" && "font-medium text-black-01",
          state === "pending" && "text-gray-05",
          state === "failed" && "font-medium text-error-text",
        )}
      >
        {text}
      </span>
      <span className="sr-only">
        {state === "done" ? "done" : state === "current" ? "in progress" : state === "failed" ? "failed" : "waiting"}
      </span>
    </li>
  );
}

function StepMark({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="grid size-5 shrink-0 place-content-center rounded-full bg-green-01 text-white animate-in zoom-in-50 duration-300">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />;
  }
  if (state === "failed") {
    return <CircleAlert className="size-5 shrink-0 text-error" aria-hidden />;
  }
  return <span className="mx-1.5 size-2 shrink-0 rounded-full bg-gray-02" aria-hidden />;
}
