import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Activity, AlertTriangle, CheckCircle2, Database, RefreshCw, Search, Server, ShieldCheck, Users, X, XCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { routesPath } from "@/routes/routes-path";
import { cn } from "@/lib/utils";
import {
  useGetAlertRulesQuery,
  useGetHealthAlertsQuery,
  useGetHealthEndpointsQuery,
  useGetHealthEndpointDetailQuery,
  useGetHealthIncidentDetailQuery,
  useGetHealthIncidentsQuery,
  useGetHealthMonitorDetailQuery,
  useGetHealthOverviewQuery,
  useGetHealthQueuesQuery,
  useGetHealthTasksQuery,
  useGetHealthUptimeQuery,
  useGetHealthServiceDetailQuery,
  useGetReliabilityQuery,
  useGetSlosQuery,
  useGetTenantHealthQuery,
  useGetTenantHealthDetailQuery,
  type HealthStatus,
  type SeriesPoint,
  type Queue,
  type Slo,
} from "@/redux/services/health-api";

const H = routesPath.PROTECTED.HEALTH;
function statusStyle(status: HealthStatus) {
  if (status === "critical") return { dot: "bg-red-500", badge: "suspended" as const, text: "Critical" };
  if (status === "warning") return { dot: "bg-amber-500", badge: "locked" as const, text: "Degraded" };
  if (status === "healthy" || status === "operational") return { dot: "bg-emerald-500", badge: "active" as const, text: "Healthy" };
  return { dot: "bg-gray-400", badge: "inactive" as const, text: "Unknown" };
}

function StatusDot({ status }: { status: HealthStatus }) {
  const style = statusStyle(status);
  return <span className="inline-flex items-center gap-2 text-xs font-medium"><span className={cn("size-2 rounded-full", style.dot)} />{style.text}</span>;
}

function PageHeader({ title, description, range, onRange, refreshing, onRefresh }: { title: string; description: string; range?: string; onRange?: (range: string) => void; refreshing?: boolean; onRefresh?: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h1 className="font-mont text-xl font-semibold text-black-01">{title}</h1><p className="mt-1 text-sm text-gray-01">{description}</p></div>
    <div className="flex items-center gap-2">
      {range && onRange && <select value={range} onChange={(event) => onRange(event.target.value)} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary"><option value="15m">Last 15 minutes</option><option value="1h">Last hour</option><option value="6h">Last 6 hours</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>}
      {onRefresh && <Button variant="white" onClick={onRefresh} disabled={refreshing}><RefreshCw className={cn("size-4", refreshing && "animate-spin")} /> Refresh</Button>}
    </div>
  </div>;
}

function QueryState({ loading, error, retry }: { loading: boolean; error: boolean; retry: () => void }) {
  if (loading) return <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-md bg-white" />)}</div>;
  if (error) return <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed bg-white"><XCircle className="size-7 text-destructive" /><p className="mt-3 text-sm font-medium">Health data could not be loaded.</p><Button className="mt-4" variant="outline" onClick={retry}>Try again</Button></div>;
  return null;
}

function MetricCard({ label, value, unit, delta, status }: { label: string; value: number | string; unit?: string; delta?: number; status?: HealthStatus }) {
  return <div className="h-full min-h-32 rounded-md bg-white p-5.5"><div className="flex items-start justify-between"><p className="text-sm font-medium text-gray-01">{label}</p>{status && <StatusDot status={status} />}</div><p className="mt-4 text-2xl font-semibold text-[#221122]">{value}<span className="ml-1 text-sm font-medium text-gray-01">{unit}</span></p>{delta != null && <p className={cn("mt-2 text-xs font-medium", delta > 0 ? "text-amber-600" : "text-emerald-600")}>{delta > 0 ? "+" : ""}{delta}% vs previous window</p>}</div>;
}

function DrawerFrame({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description: string; children: React.ReactNode }) {
  return <Sheet open={open} onOpenChange={(next) => !next && onClose()}><SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[620px]" showCloseButton={false}><SheetHeader className="sticky top-0 z-10 flex-row items-start justify-between border-b bg-white px-6 py-5"><div><SheetTitle className="font-mont text-lg text-black-01">{title}</SheetTitle><SheetDescription className="mt-1">{description}</SheetDescription></div><SheetClose asChild><button className="rounded-md p-2 text-gray-01 hover:bg-gray-50" aria-label="Close details"><X className="size-4"/></button></SheetClose></SheetHeader><div className="space-y-5 p-6 text-black-01">{children}</div></SheetContent></Sheet>;
}

function DrawerLoading({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_,i)=><Skeleton key={i} className="h-20 rounded-md"/>)}</div>;
  if (error) return <div className="rounded-md border border-dashed p-8 text-center text-sm text-destructive">Unable to load these details.</div>;
  return null;
}

function DetailMetrics({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) { return <div className="grid grid-cols-2 gap-3">{items.map(item=><div key={item.label} className="rounded-md bg-gray-50 p-4"><p className="text-xs text-gray-01">{item.label}</p><div className="mt-2 text-lg font-semibold">{item.value}</div></div>)}</div> }

function ServiceDrawer({ serviceKey, onClose }: { serviceKey: string | null; onClose: () => void }) { const query=useGetHealthServiceDetailQuery(serviceKey??"",{skip:!serviceKey});const d=query.data?.data;return <DrawerFrame open={!!serviceKey} onClose={onClose} title={d?.name??"Service details"} description={d?`${d.group} · Tier ${d.tier}`:"Live service posture and recent signals"}><DrawerLoading loading={query.isLoading} error={query.isError}/>{d&&<><div className="flex items-center justify-between rounded-md border p-4"><div><p className="text-xs text-gray-01">Current status</p><div className="mt-2"><StatusDot status={d.status}/></div></div><Server className="size-7 text-primary"/></div><DetailMetrics items={[{label:"30-day uptime",value:d.uptime?`${d.uptime.uptime_30d}%`:"—"},{label:"Average response",value:d.uptime?.avg_response_ms!=null?`${d.uptime.avg_response_ms} ms`:"—"},{label:"Service kind",value:<span className="capitalize">{d.kind}</span>},{label:"Recent alerts",value:d.recent_alerts.length}]}/><section><h3 className="font-mont text-sm font-semibold">Recent alerts</h3><div className="mt-3 space-y-3">{d.recent_alerts.length?d.recent_alerts.map(alert=><div key={alert.id} className="rounded-md border p-3"><div className="flex justify-between gap-3"><p className="text-sm font-medium">{alert.title}</p><Badge variant={alert.severity<=2?"suspended":"locked"}>SEV {alert.severity}</Badge></div><p className="mt-1 text-xs text-gray-01">{new Date(alert.fired_at).toLocaleString()}</p></div>):<Empty text="No recent alerts"/>}</div></section></>}</DrawerFrame> }

function MonitorDrawer({ monitorKey, onClose }: { monitorKey: string | null; onClose: () => void }) {const query=useGetHealthMonitorDetailQuery(monitorKey??"",{skip:!monitorKey});const d=query.data?.data;return <DrawerFrame open={!!monitorKey} onClose={onClose} title={d?.name??"Monitor details"} description="Availability, latency, and certificate timeline"><DrawerLoading loading={query.isLoading} error={query.isError}/>{d&&<><div className="flex items-center justify-between rounded-md border p-4"><StatusDot status={d.status}/><span className="text-2xl font-semibold">{d.uptime_30d}%</span></div><DetailMetrics items={[{label:"24-hour uptime",value:`${d.uptime_24h}%`},{label:"7-day uptime",value:`${d.uptime_7d}%`},{label:"90-day uptime",value:`${d.uptime_90d}%`},{label:"Average response",value:d.avg_response_ms!=null?`${d.avg_response_ms} ms`:"—"}]}/>{d.response_series.length>0&&<section><h3 className="mb-3 font-mont text-sm font-semibold">Response time</h3><TrendChart data={d.response_series.map(p=>({t:p.t,requests:p.ms,status_2xx:0,status_3xx:0,status_4xx:0,status_5xx:0,error_rate:0,p95:p.ms}))} dataKey="p95"/></section>}{d.ssl&&<section className="rounded-md border p-4"><p className="text-xs text-gray-01">TLS certificate</p><p className="mt-2 font-medium">{d.ssl.domain||"Configured domain"}</p><p className="mt-1 text-sm text-gray-01">{d.ssl.days_left??"—"} days remaining</p></section>}</>}</DrawerFrame>}

function EndpointDrawer({ route, range, onClose }: { route: string | null; range: string; onClose: () => void }) {const query=useGetHealthEndpointDetailQuery({route:route??"",range},{skip:!route});const d=query.data?.data;return <DrawerFrame open={!!route} onClose={onClose} title="Endpoint details" description={route??"Request performance and tenant impact"}><DrawerLoading loading={query.isLoading} error={query.isError}/>{d&&<><DetailMetrics items={[{label:"Requests",value:d.totals.requests.toLocaleString()},{label:"Error rate",value:`${d.totals.error_rate}%`},{label:"P95 latency",value:`${d.p95} ms`},{label:"Throttled",value:d.totals.throttled}]}/><section><h3 className="mb-3 font-mont text-sm font-semibold">Request trend</h3><TrendChart data={d.series}/></section><section><h3 className="font-mont text-sm font-semibold">Affected tenants</h3><div className="mt-3 space-y-2">{d.affected_tenants.length?d.affected_tenants.map(t=><div key={t.school_id} className="flex items-center justify-between rounded-md border p-3"><div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-gray-01">{t.requests.toLocaleString()} requests</p></div><Badge variant={t.error_rate>1?"locked":"active"}>{t.error_rate}% errors</Badge></div>):<Empty text="No tenant impact recorded"/>}</div></section></>}</DrawerFrame>}

function IncidentDrawer({ incidentId, onClose }: { incidentId: string | null; onClose: () => void }) {
  const query = useGetHealthIncidentDetailQuery(incidentId ?? "", { skip: !incidentId });
  const d = query.data?.data;
  return <DrawerFrame open={!!incidentId} onClose={onClose} title={d?.title ?? "Incident war room"} description={d ? `${d.code} · ${d.status}` : "Timeline, impact, ownership, and response context"}>
    <DrawerLoading loading={query.isLoading} error={query.isError}/>
    {d && <>
      <div className="flex items-center justify-between rounded-md border p-4"><Badge variant={d.severity <= 2 ? "suspended" : "locked"}>SEV {d.severity}</Badge><span className="text-sm font-medium capitalize">{d.status}</span></div>
      <DetailMetrics items={[{label:"Owner",value:d.owner_label||"Unassigned"},{label:"Affected tenants",value:d.affected_tenant_count},{label:"Services",value:d.service_keys.length},{label:"Started",value:new Date(d.started_at).toLocaleString()}]}/>
      {d.summary && <section><h3 className="font-mont text-sm font-semibold">Summary</h3><p className="mt-2 text-sm leading-6 text-gray-05">{d.summary}</p></section>}
      <section><h3 className="font-mont text-sm font-semibold">Incident timeline</h3><div className="mt-4 space-y-0">{d.timeline.length ? d.timeline.map((event,index)=><div key={event.id} className="relative flex gap-3 pb-5"><div className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-primary"/>{index < d.timeline.length-1 && <span className="absolute left-[4px] top-3 h-full w-px bg-gray-200"/>}<div><p className="text-sm font-medium">{event.text}</p><p className="mt-1 text-xs text-gray-01">{event.who} · {new Date(event.created_at).toLocaleString()}</p></div></div>) : <Empty text="No timeline events"/>}</div></section>
    </>}
  </DrawerFrame>;
}

function TenantDrawer({ tenant, range, onClose }: { tenant: {id:number;name:string}|null; range:string; onClose:()=>void }) {const query=useGetTenantHealthDetailQuery({id:tenant?.id??0,range},{skip:!tenant});const d=query.data?.data;return <DrawerFrame open={!!tenant} onClose={onClose} title={tenant?.name??"Tenant details"} description="Tenant-scoped latency, traffic, errors, and endpoint health"><DrawerLoading loading={query.isLoading} error={query.isError}/>{d&&<><div className="grid grid-cols-2 gap-3">{(["latency","traffic","errors","saturation"] as const).map(k=><MetricCard key={k} label={k} {...d.kpis[k]}/>)}</div><section><h3 className="mb-3 font-mont text-sm font-semibold">Request activity</h3><TrendChart data={d.series}/></section><section><h3 className="font-mont text-sm font-semibold">Top endpoints</h3><div className="mt-3 space-y-2">{d.endpoints.slice(0,8).map(e=><div key={`${e.method}-${e.route}`} className="flex items-center justify-between gap-3 rounded-md border p-3"><p className="min-w-0 truncate font-mono text-xs">{e.method} {e.route}</p><span className="text-xs font-semibold">{e.p95} ms</span></div>)}</div></section></>}</DrawerFrame>}

function QueueDrawer({ queue, onClose }: { queue: Queue|null; onClose:()=>void }) {return <DrawerFrame open={!!queue} onClose={onClose} title={queue?.name??"Queue details"} description="Depth, throughput, retries, failures, and recent pressure">{queue&&<><div className="flex items-center justify-between rounded-md border p-4"><StatusDot status={queue.status}/><span className="text-2xl font-semibold">{queue.depth} waiting</span></div><DetailMetrics items={[{label:"Throughput",value:`${queue.throughput_per_min}/min`},{label:"Average duration",value:`${queue.avg_duration_sec}s`},{label:"Retrying",value:queue.retrying},{label:"Failed",value:queue.failed},{label:"Dead",value:queue.dead},{label:"Retry storm",value:queue.retry_storm?"Detected":"No"}]}/><section><h3 className="mb-3 font-mont text-sm font-semibold">Queue depth trend</h3><TrendChart data={queue.depth_trend.map((v,i)=>({t:String(i),requests:v,status_2xx:0,status_3xx:0,status_4xx:0,status_5xx:0,error_rate:0,p95:0}))}/></section></>}</DrawerFrame>}

function SloDrawer({ slo, onClose }: { slo:Slo|null; onClose:()=>void }) {return <DrawerFrame open={!!slo} onClose={onClose} title={slo?.service??"SLO details"} description="Objective attainment and error-budget interpretation">{slo&&<><div className="flex items-center justify-between rounded-md border p-4"><Badge variant={slo.breached?"suspended":"active"}>{slo.breached?"Objective breached":"Meeting objective"}</Badge><span className="text-2xl font-semibold">{slo.current}%</span></div><DetailMetrics items={[{label:"Target",value:`${slo.target}%`},{label:"Window",value:`${slo.window_days} days`},{label:"Budget remaining",value:`${slo.error_budget_remaining}%`},{label:"Budget consumed",value:`${Math.max(0,100-slo.error_budget_remaining).toFixed(1)}%`}]}/><section className="rounded-md bg-gray-50 p-4"><h3 className="font-mont text-sm font-semibold">What this means</h3><p className="mt-2 text-sm leading-6 text-gray-05">{slo.breached?"Observed availability is below the reliability target. Prioritize stability work until the rolling window recovers.":slo.error_budget_remaining<25?"The objective is currently met, but little error budget remains. Changes should be made cautiously.":"The service is meeting its reliability target with sufficient budget remaining for normal delivery."}</p></section></>}</DrawerFrame>}

function TrendChart({ data, dataKey = "requests", color = "#7557D3" }: { data: SeriesPoint[]; dataKey?: keyof SeriesPoint; color?: string }) {
  if (dataKey === "status_2xx") return <StatusCodeChart data={data}/>;
  const timestamps = data.map((point) => point.t).filter((value) => /^\d{4}-\d{2}-\d{2}T/.test(value));
  const spansDays = timestamps.length > 1 && new Date(timestamps[timestamps.length - 1]).getTime() - new Date(timestamps[0]).getTime() > 36 * 60 * 60 * 1000;
  const tick = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
    const date = new Date(value);
    return spansDays
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
  const tooltipLabel = (value: React.ReactNode) => {
    const raw = String(value ?? "");
    if (!/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw;
    return new Date(raw).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ bottom: 8 }}><defs><linearGradient id={`health-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.28}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAF1"/><XAxis dataKey="t" tickFormatter={tick} interval="preserveStartEnd" minTickGap={34} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#74778e" }} height={34}/><YAxis tickLine={false} axisLine={false} width={42} fontSize={11}/><Tooltip labelFormatter={tooltipLabel}/><Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#health-${dataKey})`}/></AreaChart></ResponsiveContainer></div>;
}

function StatusCodeChart({ data }: { data: SeriesPoint[] }) {
  const spansDays = data.length > 1 && new Date(data[data.length - 1].t).getTime() - new Date(data[0].t).getTime() > 36 * 60 * 60 * 1000;
  const tick = (value: string) => {
    const date = new Date(value);
    return spansDays
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{bottom:8}}><defs><linearGradient id="status-2xx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A36A" stopOpacity={0.24}/><stop offset="95%" stopColor="#16A36A" stopOpacity={0}/></linearGradient><linearGradient id="status-3xx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.22}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient><linearGradient id="status-4xx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D99018" stopOpacity={0.22}/><stop offset="95%" stopColor="#D99018" stopOpacity={0}/></linearGradient><linearGradient id="status-5xx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#DC3F4F" stopOpacity={0.24}/><stop offset="95%" stopColor="#DC3F4F" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEAF1"/><XAxis dataKey="t" tickFormatter={tick} interval="preserveStartEnd" minTickGap={34} tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#74778e"}} height={34}/><YAxis tickLine={false} axisLine={false} width={42} fontSize={11}/><Tooltip content={({active,payload,label})=>active&&payload?.length?<div className="min-w-32 rounded-lg border border-gray-100 bg-white px-3.5 py-3 shadow-lg"><p className="border-b border-gray-100 pb-2 text-[11px] font-medium text-gray-01">{new Date(String(label)).toLocaleString()}</p><div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">{payload.map((entry)=><div key={String(entry.dataKey)} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{backgroundColor:entry.color}}/><span className="font-mono text-sm font-semibold text-black-01">{Number(entry.value??0).toLocaleString()}</span></div>)}</div></div>:null}/><Legend iconType="circle" iconSize={8}/><Area name="2xx Success" type="monotone" dataKey="status_2xx" stroke="#16A36A" strokeWidth={2} fill="url(#status-2xx)"/><Area name="3xx Redirect" type="monotone" dataKey="status_3xx" stroke="#3B82F6" strokeWidth={2} fill="url(#status-3xx)"/><Area name="4xx Client error" type="monotone" dataKey="status_4xx" stroke="#D99018" strokeWidth={2} fill="url(#status-4xx)"/><Area name="5xx Server error" type="monotone" dataKey="status_5xx" stroke="#DC3F4F" strokeWidth={2} fill="url(#status-5xx)"/></AreaChart></ResponsiveContainer></div>;
}

function CommandCenter() {
  const [range, setRange] = useState("1h");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const query = useGetHealthOverviewQuery({ range });
  const data = query.data?.data;
  const state = <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch} />;
  if (!data) return <HealthFrame><PageHeader title="Command Center" description="A live, unified view of platform reliability." range={range} onRange={setRange} onRefresh={query.refetch} refreshing={query.isFetching}/>{state}</HealthFrame>;
  return <HealthFrame>
    <PageHeader title="Command Center" description="A live, unified view of platform reliability." range={range} onRange={setRange} onRefresh={query.refetch} refreshing={query.isFetching}/>
    <div className={cn("flex items-center justify-between rounded-md border px-5 py-4", data.posture.overall === "operational" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}><div className="flex items-center gap-3"><span className={cn("flex size-10 items-center justify-center rounded-full", data.posture.overall === "operational" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{data.posture.overall === "operational" ? <CheckCircle2/> : <AlertTriangle/>}</span><div><p className="font-mont font-semibold">{data.posture.label}</p><p className="text-xs text-gray-01">{data.posture.active_incidents} active incidents · {data.global_uptime}% 30-day uptime</p></div></div><Badge variant={data.posture.overall === "operational" ? "active" : "locked"}>{data.posture.overall}</Badge></div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{(["latency", "traffic", "errors", "saturation"] as const).map((key) => <MetricCard key={key} label={{ latency: "P95 latency", traffic: "Traffic", errors: "Error rate", saturation: "Saturation" }[key]} {...data.kpis[key]}/>)}</div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_1fr]"><section className="rounded-md bg-white p-5.5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-mont font-semibold">Request activity</h2><p className="text-xs text-gray-01">Traffic through the platform over the selected window</p></div><Activity className="size-5 text-primary"/></div><TrendChart data={data.request_series}/></section><section className="rounded-md bg-white p-5.5"><h2 className="font-mont font-semibold">Active incidents</h2><div className="mt-4 space-y-3">{data.active_incidents.length ? data.active_incidents.slice(0,5).map((incident) => <button type="button" onClick={()=>setSelectedIncident(incident.id)} key={incident.id} className="block w-full rounded-md border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"><div className="flex justify-between gap-3"><p className="text-sm font-medium">{incident.title}</p><Badge variant={incident.severity <= 2 ? "suspended" : "locked"}>SEV {incident.severity}</Badge></div><p className="mt-1 text-xs text-gray-01">{incident.code} · {incident.owner_label || "Unassigned"}</p></button>) : <Empty text="No active incidents"/>}</div></section></div>
    <section><div className="mb-3"><h2 className="font-mont font-semibold">Service health</h2><p className="text-xs text-gray-01">Select a service to inspect uptime and recent alerts</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.services.map((service) => <button type="button" onClick={()=>setSelectedService(service.key)} key={service.key} className="rounded-md bg-white p-4 text-left transition-colors hover:bg-pry-01/40"><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-md bg-gray-50 text-primary"><Server className="size-4"/></span><StatusDot status={service.status}/></div><p className="mt-4 text-sm font-semibold">{service.name}</p><p className="mt-1 text-xs text-gray-01">{service.group} · Tier {service.tier}</p></button>)}</div></section>
    <ServiceDrawer serviceKey={selectedService} onClose={()=>setSelectedService(null)}/>
    <IncidentDrawer incidentId={selectedIncident} onClose={()=>setSelectedIncident(null)}/>
  </HealthFrame>;
}

function UptimePage() {
  const query = useGetHealthUptimeQuery(); const monitors = query.data?.data.monitors; const [selectedMonitor,setSelectedMonitor]=useState<string|null>(null);
  if (!monitors) return <HealthFrame><PageHeader title="Uptime" description="Availability, response time, and certificate health." onRefresh={query.refetch} refreshing={query.isFetching}/><QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}/></HealthFrame>;
  return <HealthFrame><PageHeader title="Uptime" description="Availability, response time, and certificate health." onRefresh={query.refetch} refreshing={query.isFetching}/><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Monitors" value={monitors.length}/><MetricCard label="Healthy" value={monitors.filter((m) => m.status === "healthy").length} status="healthy"/><MetricCard label="Average uptime" value={(monitors.reduce((sum,m)=>sum+m.uptime_30d,0)/Math.max(monitors.length,1)).toFixed(3)} unit="%"/><MetricCard label="Certificates tracked" value={monitors.filter((m)=>m.ssl).length}/></div><section className="overflow-hidden rounded-md bg-white"><div className="border-b px-5.5 py-4"><h2 className="font-mont font-semibold">Service monitors</h2><p className="text-xs text-gray-01">Select a monitor for its response and certificate details</p></div><div className="divide-y">{monitors.map((monitor)=><button type="button" onClick={()=>setSelectedMonitor(monitor.key)} key={monitor.key} className="block w-full p-5.5 text-left transition-colors hover:bg-gray-50"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-medium">{monitor.name}</p><StatusDot status={monitor.status}/></div><p className="mt-1 text-xs text-gray-01">Average response {monitor.avg_response_ms ?? 0} ms{monitor.ssl?.domain ? ` · SSL ${monitor.ssl.days_left ?? "—"} days` : ""}</p></div><div className="flex gap-5 text-right text-xs"><div><p className="text-gray-01">24h</p><p className="mt-1 font-semibold">{monitor.uptime_24h}%</p></div><div><p className="text-gray-01">7d</p><p className="mt-1 font-semibold">{monitor.uptime_7d}%</p></div><div><p className="text-gray-01">30d</p><p className="mt-1 font-semibold">{monitor.uptime_30d}%</p></div></div></div><div className="mt-4 flex h-7 gap-0.5">{monitor.segments.length ? monitor.segments.slice(-90).map((segment)=><span key={segment.day} title={`${segment.day}: ${segment.uptime}%`} className={cn("min-w-0 flex-1 rounded-sm", statusStyle(segment.status).dot)}/>) : <div className="flex w-full items-center justify-center rounded bg-gray-50 text-xs text-gray-01">No history yet</div>}</div></button>)}</div></section><MonitorDrawer monitorKey={selectedMonitor} onClose={()=>setSelectedMonitor(null)}/></HealthFrame>;
}

function ApiPage() {
  const [range,setRange]=useState("1h"); const [search,setSearch]=useState(""); const [selectedRoute,setSelectedRoute]=useState<string|null>(null); const query=useGetHealthEndpointsQuery({range}); const data=query.data?.data;
  const endpoints=useMemo(()=>data?.endpoints.filter((e)=>`${e.method} ${e.route}`.toLowerCase().includes(search.toLowerCase()))??[],[data,search]);
  if(!data)return <HealthFrame><PageHeader title="API & Endpoints" description="Latency, request volume, errors, and throttling by route." range={range} onRange={setRange}/><QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}/></HealthFrame>;
  return <HealthFrame><PageHeader title="API & Endpoints" description="Latency, request volume, errors, and throttling by route." range={range} onRange={setRange} onRefresh={query.refetch} refreshing={query.isFetching}/><div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><RankPanel title="Slowest endpoints" rows={data.top_slowest} metric={(e)=>`${e.p95} ms p95`}/><RankPanel title="Highest error rates" rows={data.top_errors} metric={(e)=>`${e.error_rate}% errors`}/></div><section className="rounded-md bg-white p-5.5"><h2 className="font-mont font-semibold">Status code traffic</h2><TrendChart data={data.status_code_series} dataKey="status_2xx" color="#16A36A"/></section><section className="overflow-hidden rounded-md bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="font-mont font-semibold">Endpoint inventory</h2><p className="text-xs text-gray-01">Select a route for latency distribution and tenant impact</p></div><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-01"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search route" className="w-64 pl-9"/></div></div><Table onRowClick={(index)=>setSelectedRoute(endpoints[index].route)} headers={["Endpoint","Requests","RPM","P50","P95","P99","Errors","Status"]} rows={endpoints.map((e)=>[<span className="font-mono text-xs"><Badge variant="inactive" className="mr-2">{e.method}</Badge>{e.route}</span>,e.requests,e.rpm,`${e.p50} ms`,`${e.p95} ms`,`${e.p99} ms`,`${e.error_rate}%`,<StatusDot status={e.status}/>])}/></section><EndpointDrawer route={selectedRoute} range={range} onClose={()=>setSelectedRoute(null)}/></HealthFrame>;
}

function RankPanel({title,rows,metric}:{title:string;rows:import("@/redux/services/health-api").Endpoint[];metric:(row:import("@/redux/services/health-api").Endpoint)=>string}){return <section className="rounded-md bg-white p-5.5"><h2 className="font-mont font-semibold">{title}</h2><div className="mt-4 space-y-3">{rows.length?rows.map((row,index)=><div key={`${row.method}-${row.route}`} className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded bg-gray-50 text-xs font-semibold">{index+1}</span><p className="min-w-0 flex-1 truncate font-mono text-xs">{row.method} {row.route}</p><span className="text-xs font-semibold text-gray-05">{metric(row)}</span></div>):<Empty text="No endpoint data"/>}</div></section>}

function JobsPage(){const [status,setStatus]=useState("all");const [selectedQueue,setSelectedQueue]=useState<Queue|null>(null);const queues=useGetHealthQueuesQuery();const tasks=useGetHealthTasksQuery({page:1,page_size:25,...(status!=="all"?{status}: {})});const data=queues.data?.data;return <HealthFrame><PageHeader title="Jobs & Queues" description="Background processing, queue pressure, workers, and failures." onRefresh={()=>{queues.refetch();tasks.refetch()}} refreshing={queues.isFetching||tasks.isFetching}/>{!data?<QueryState loading={queues.isLoading} error={queues.isError} retry={queues.refetch}/>:<><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Queued jobs" value={data.queues.reduce((s,q)=>s+q.depth,0)}/><MetricCard label="Active workers" value={data.workers.active} status="healthy"/><MetricCard label="Idle workers" value={data.workers.idle}/><MetricCard label="Failed jobs" value={data.queues.reduce((s,q)=>s+q.failed,0)} status={data.queues.some(q=>q.failed)?"warning":"healthy"}/></div><div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{data.queues.map(q=><button type="button" onClick={()=>setSelectedQueue(q)} key={q.name} className="rounded-md bg-white p-5 text-left transition-colors hover:bg-pry-01/40"><div className="flex justify-between"><div><p className="font-mont font-semibold capitalize">{q.name}</p><p className="mt-1 text-xs text-gray-01">{q.throughput_per_min}/min throughput</p></div><StatusDot status={q.status}/></div><p className="mt-5 text-3xl font-semibold">{q.depth}</p><p className="text-xs text-gray-01">jobs waiting</p><div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-gray-50 p-3 text-center text-xs"><div><p className="font-semibold">{q.retrying}</p><p className="text-gray-01">Retrying</p></div><div><p className="font-semibold">{q.failed}</p><p className="text-gray-01">Failed</p></div><div><p className="font-semibold">{q.dead}</p><p className="text-gray-01">Dead</p></div></div></button>)}</div></>}{tasks.data&&<section className="overflow-hidden rounded-md bg-white"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-mont font-semibold">Recent tasks</h2><p className="text-xs text-gray-01">Background job execution history</p></div><select value={status} onChange={(e)=>setStatus(e.target.value)} className="h-9 rounded-md border bg-white px-3 text-sm"><option value="all">All statuses</option><option value="pending">Pending</option><option value="running">Running</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div><Table headers={["Task","Queue","Tenant","Status","Duration","Created"]} rows={tasks.data.data.map(t=>[<div><p className="text-sm font-medium">{t.label||t.task_name}</p><p className="text-xs text-gray-01">{t.kind}</p></div>,t.queue,t.tenant||"Global",<Badge variant={t.status==="COMPLETED"?"active":t.status==="FAILED"?"suspended":"locked"}>{t.status}</Badge>,t.duration_sec!=null?`${t.duration_sec}s`:"—",new Date(t.created_at).toLocaleString()])}/></section>}<QueueDrawer queue={selectedQueue} onClose={()=>setSelectedQueue(null)}/></HealthFrame>}

function IncidentsPage(){
  const [tab,setTab]=useState<"incidents"|"alerts"|"rules">("incidents");
  const [selectedIncident,setSelectedIncident]=useState<string|null>(null);
  const incidents=useGetHealthIncidentsQuery({page:1,page_size:25});
  const alerts=useGetHealthAlertsQuery({page:1,page_size:25});
  const rules=useGetAlertRulesQuery();
  const reliability=useGetReliabilityQuery();
  const incidentRows=incidents.data?.data??[];
  return <HealthFrame>
    <PageHeader title="Incidents & Alerts" description="Coordinate incidents and review the signals that triggered them." onRefresh={()=>{incidents.refetch();alerts.refetch();rules.refetch();reliability.refetch()}} refreshing={incidents.isFetching||alerts.isFetching}/>
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4"><MetricCard label="Active incidents" value={reliability.data?.data.active??0} status={(reliability.data?.data.active??0)>0?"warning":"healthy"}/><MetricCard label="Incidents · 30d" value={reliability.data?.data.incidents??0}/><MetricCard label="Mean acknowledge" value={reliability.data?.data.mtta_min??"—"} unit="min"/><MetricCard label="Mean resolve" value={reliability.data?.data.mttr_min??"—"} unit="min"/></div>
    <div className="inline-flex rounded-md bg-white p-1">{(["incidents","alerts","rules"] as const).map(item=><button key={item} onClick={()=>setTab(item)} className={cn("rounded px-4 py-2 text-sm font-medium capitalize",tab===item&&"bg-pry-01")}>{item}</button>)}</div>
    <section className="overflow-hidden rounded-md bg-white">
      {tab==="incidents"&&<Table onRowClick={(index)=>setSelectedIncident(incidentRows[index].id)} headers={["Incident","Severity","Status","Owner","Tenants","Started"]} rows={incidentRows.map(i=>[<div><p className="text-sm font-medium">{i.title}</p><p className="text-xs text-gray-01">{i.code}</p></div>,<Badge variant={i.severity<=2?"suspended":"locked"}>SEV {i.severity}</Badge>,i.status,i.owner_label||"Unassigned",i.affected_tenant_count,new Date(i.started_at).toLocaleString()])}/>} 
      {tab==="alerts"&&<Table headers={["Alert","Rule","Service","Value","Threshold","Fired"]} rows={(alerts.data?.data??[]).map(a=>[<div><p className="text-sm font-medium">{a.title}</p><Badge variant={a.severity<=2?"suspended":"locked"}>SEV {a.severity}</Badge></div>,a.rule_name,a.service_key||"Platform",a.value,a.threshold,new Date(a.fired_at).toLocaleString()])}/>} 
      {tab==="rules"&&<Table headers={["Rule","Metric","Condition","Target","Channel","Status"]} rows={(rules.data?.data??[]).map(r=>[r.name,r.metric,`${r.comparator} ${r.threshold}`,r.target_service_key||r.target_queue||"Global",r.channel,<Badge variant={r.is_enabled?"active":"inactive"}>{r.is_enabled?"Enabled":"Disabled"}</Badge>])}/>} 
    </section>
    <IncidentDrawer incidentId={selectedIncident} onClose={()=>setSelectedIncident(null)}/>
  </HealthFrame>
}

function TenantsPage(){
  const [range,setRange]=useState("1h");
  const [search,setSearch]=useState("");
  const [selectedTenant,setSelectedTenant]=useState<{id:number;name:string}|null>(null);
  const query=useGetTenantHealthQuery({range});
  const tenants=useMemo(()=>query.data?.data.tenants.filter(t=>t.name.toLowerCase().includes(search.toLowerCase()))??[],[query.data,search]);
  const all=query.data?.data.tenants;
  if(!all)return <HealthFrame><PageHeader title="Tenant Health" description="Compare tenant-level demand, latency, and error signals." range={range} onRange={setRange}/><QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}/></HealthFrame>;
  return <HealthFrame>
    <PageHeader title="Tenant Health" description="Compare tenant-level demand, latency, and error signals." range={range} onRange={setRange} onRefresh={query.refetch} refreshing={query.isFetching}/>
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4"><MetricCard label="Observed tenants" value={all.length}/><MetricCard label="Healthy" value={all.filter(t=>t.status==="healthy").length} status="healthy"/><MetricCard label="Needs attention" value={all.filter(t=>t.status!=="healthy").length} status={all.some(t=>t.status!=="healthy")?"warning":"healthy"}/><MetricCard label="High-volume tenants" value={all.filter(t=>t.noisy).length}/></div>
    <section className="overflow-hidden rounded-md bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="font-mont font-semibold">Tenant signals</h2><p className="text-xs text-gray-01">Select a tenant for scoped traffic and endpoint details</p></div><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-01"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find tenant" className="w-64 pl-9"/></div></div><Table onRowClick={(index)=>setSelectedTenant({id:tenants[index].school_id,name:tenants[index].name})} headers={["Tenant","Status","Requests","RPM","P95 latency","Error rate","Volume"]} rows={tenants.map(t=>[<div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-pry-01 text-primary"><Users className="size-4"/></span><span className="font-medium">{t.name}</span></div>,<StatusDot status={t.status}/>,t.requests,t.rpm,`${t.p95} ms`,`${t.error_rate}%`,t.noisy?<Badge variant="locked">High volume</Badge>:<span className="text-xs text-gray-01">Normal</span>])}/></section>
    <TenantDrawer tenant={selectedTenant} range={range} onClose={()=>setSelectedTenant(null)}/>
  </HealthFrame>
}

function SlosPage(){
  const query=useGetSlosQuery();
  const [selectedSlo,setSelectedSlo]=useState<Slo|null>(null);
  const slos=query.data?.data.slos;
  if(!slos)return <HealthFrame><PageHeader title="Service Level Objectives" description="Service Level Objectives (SLOs), reliability attainment, and remaining error budgets."/><QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}/></HealthFrame>;
  const healthy=slos.filter(s=>!s.breached).length;
  return <HealthFrame>
    <PageHeader title="Service Level Objectives" description="Service Level Objectives (SLOs), reliability attainment, and remaining error budgets." onRefresh={query.refetch} refreshing={query.isFetching}/>
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4"><MetricCard label="Objectives" value={slos.length}/><MetricCard label="Meeting target" value={healthy} status="healthy"/><MetricCard label="Breached" value={slos.length-healthy} status={healthy===slos.length?"healthy":"critical"}/><MetricCard label="Average budget" value={(slos.reduce((sum,s)=>sum+s.error_budget_remaining,0)/Math.max(slos.length,1)).toFixed(1)} unit="%"/></div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{slos.map(s=><button type="button" onClick={()=>setSelectedSlo(s)} key={s.service_key} className="rounded-md bg-white p-5.5 text-left transition-colors hover:bg-pry-01/40"><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-md bg-pry-01 text-primary"><ShieldCheck className="size-5"/></span><Badge variant={s.breached?"suspended":"active"}>{s.breached?"Breached":"On target"}</Badge></div><h2 className="mt-5 font-mont font-semibold">{s.service}</h2><p className="mt-1 text-xs text-gray-01">{s.window_days}-day availability objective</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-md bg-gray-50 p-3"><p className="text-xs text-gray-01">Current</p><p className="mt-1 text-xl font-semibold">{s.current}%</p></div><div className="rounded-md bg-gray-50 p-3"><p className="text-xs text-gray-01">Target</p><p className="mt-1 text-xl font-semibold">{s.target}%</p></div></div><div className="mt-5"><div className="flex justify-between text-xs"><span className="text-gray-01">Error budget remaining</span><span className="font-semibold">{s.error_budget_remaining}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className={cn("h-full rounded-full",s.error_budget_remaining<20?"bg-red-500":s.error_budget_remaining<50?"bg-amber-500":"bg-primary")} style={{width:`${Math.min(100,s.error_budget_remaining)}%`}}/></div></div></button>)}</div>
    <SloDrawer slo={selectedSlo} onClose={()=>setSelectedSlo(null)}/>
  </HealthFrame>
}

function Table({headers,rows,onRowClick}:{headers:string[];rows:Array<Array<React.ReactNode>>;onRowClick?:(index:number)=>void}){return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b bg-gray-50/70">{headers.map(h=><th key={h} className="px-5 py-3 text-xs font-semibold text-gray-01">{h}</th>)}</tr></thead><tbody className="divide-y">{rows.length?rows.map((row,i)=><tr key={i} onClick={()=>onRowClick?.(i)} className={cn("hover:bg-gray-50/50",onRowClick&&"cursor-pointer")}>{row.map((cell,j)=><td key={j} className="px-5 py-4 text-sm">{cell}</td>)}</tr>):<tr><td colSpan={headers.length}><Empty text="No data for this view"/></td></tr>}</tbody></table></div>}
function Empty({text}:{text:string}){return <div className="flex min-h-28 flex-col items-center justify-center text-center text-sm text-gray-01"><Database className="mb-2 size-5"/>{text}</div>}
function HealthFrame({children}:{children:React.ReactNode}){return <DashboardLayout title="Health"><main className="space-y-5 px-4.5 py-6 text-black-01">{children}</main></DashboardLayout>}

export default function HealthPage(){const {pathname}=useLocation();if(pathname===H.UPTIME)return <UptimePage/>;if(pathname===H.API)return <ApiPage/>;if(pathname===H.JOBS)return <JobsPage/>;if(pathname===H.INCIDENTS)return <IncidentsPage/>;if(pathname===H.TENANTS)return <TenantsPage/>;if(pathname===H.SLOS)return <SlosPage/>;return <CommandCenter/>}
