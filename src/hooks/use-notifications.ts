import { useGetNotificationsQuery, useGetUnreadCountQuery } from "@/redux/services/notifications-api";

const POLL={pollingInterval:60_000,skipPollingIfUnfocused:true,refetchOnFocus:true} as const;
export function useNotifications(){
  const feed=useGetNotificationsQuery({page:1,page_size:5,is_read:false},POLL);
  const unread=useGetUnreadCountQuery(undefined,POLL);
  return {items:feed.data?.data??[],count:unread.data?.data.unread_count??0,isLoading:feed.isLoading||unread.isLoading};
}
