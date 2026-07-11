import { baseApi } from "./base-api";import { generateQueryString } from "@/utils/helpers";
export interface ConfigDefinition{id:string;key:string;label:string;description:string;value_type:string;default_value:unknown;validation_rules:Record<string,unknown>;allowed_scopes:string[];sensitivity:string;is_active:boolean;updated_at:string}
export interface ConfigValue{id:string;definition:string;key:string;school:string|null;branch:string|null;value:unknown;updated_by:{full_name:string;email:string}|null;updated_at:string}
export interface Capability{id:string;key:string;label:string;description:string;kind:string;requires_entitlement:boolean;default_enabled:boolean;is_active:boolean;metadata:Record<string,unknown>;dependencies:string[];updated_at:string}
export interface Entitlement{id:string;capability:string;capability_key:string;school:string|null;state:string;source:string;starts_at:string|null;ends_at:string|null;updated_at:string}
export interface Override{id:string;capability:string;capability_key:string;school:string|null;branch:string|null;state:string;reason:string;updated_at:string}
export interface ConfigAudit{id:string;action:string;target_type:string;target_id:string;school:string|null;branch:string|null;actor:{full_name:string;email:string}|null;before_data:unknown;after_data:unknown;reason:string;created_at:string}
interface Page<T>{data:T[];pagination?:{totalItems:number;totalPages:number;currentPage:number;pageSize:number}}
export const configApi=baseApi.injectEndpoints({endpoints:b=>({
 getConfigDefinitions:b.query<Page<ConfigDefinition>,void>({query:()=>"/config/definitions/",providesTags:["Config"]}),
 createConfigDefinition:b.mutation<{data:ConfigDefinition},Partial<ConfigDefinition>>({query:body=>({url:"/config/definitions/",method:"POST",body}),invalidatesTags:["Config"]}),
 updateConfigDefinition:b.mutation<{data:ConfigDefinition},{key:string;body:Partial<ConfigDefinition>}>({query:({key,body})=>({url:`/config/definitions/${key}/`,method:"PATCH",body}),invalidatesTags:["Config"]}),
 archiveConfigDefinition:b.mutation<void,{key:string;reason:string}>({query:({key,...body})=>({url:`/config/definitions/${key}/`,method:"DELETE",body}),invalidatesTags:["Config"]}),
 getConfigValues:b.query<Page<ConfigValue>,Record<string,string>>({query:p=>`/config/values/${generateQueryString(p)}`,providesTags:["Config"]}),
 setConfigValues:b.mutation<{data:ConfigValue[]},{values:Array<{key:string;value:unknown;reason:string}>;school?:string;branch?:string}>({query:body=>({url:"/config/values/",method:"POST",body}),invalidatesTags:["Config"]}),
 getEffectiveConfig:b.query<{data:Record<string,unknown>},Record<string,string>>({query:p=>`/config/effective-values/${generateQueryString(p)}`,providesTags:["Config"]}),
 getCapabilities:b.query<Page<Capability>,void>({query:()=>"/config/capabilities/",providesTags:["Config"]}),
 createCapability:b.mutation<{data:Capability},Partial<Capability>>({query:body=>({url:"/config/capabilities/",method:"POST",body}),invalidatesTags:["Config"]}),
 updateCapability:b.mutation<{data:Capability},{key:string;body:Partial<Capability>}>({query:({key,body})=>({url:`/config/capabilities/${key}/`,method:"PATCH",body}),invalidatesTags:["Config"]}),
 archiveCapability:b.mutation<void,{key:string;reason:string}>({query:({key,...body})=>({url:`/config/capabilities/${key}/`,method:"DELETE",body}),invalidatesTags:["Config"]}),
 getEntitlements:b.query<Page<Entitlement>,Record<string,string>>({query:p=>`/config/entitlements/${generateQueryString(p)}`,providesTags:["Config"]}),
 setEntitlement:b.mutation<{data:Entitlement},Record<string,unknown>>({query:body=>({url:"/config/entitlements/",method:"POST",body}),invalidatesTags:["Config"]}),
 getOverrides:b.query<Page<Override>,Record<string,string>>({query:p=>`/config/overrides/${generateQueryString(p)}`,providesTags:["Config"]}),
 setOverride:b.mutation<{data:Override},Record<string,unknown>>({query:body=>({url:"/config/overrides/",method:"POST",body}),invalidatesTags:["Config"]}),
 getConfigAudit:b.query<Page<ConfigAudit>,Record<string,string>>({query:p=>`/config/audit-events/${generateQueryString(p)}`,providesTags:["Config"]}),
 exportConfig:b.query<{data:{values:Array<{key:string;value:unknown;source:string}>;capabilities:Array<{key:string;enabled:boolean}>}},void>({query:()=>"/config/export/"}),
})});
export const{useGetConfigDefinitionsQuery,useCreateConfigDefinitionMutation,useUpdateConfigDefinitionMutation,useArchiveConfigDefinitionMutation,useGetConfigValuesQuery,useSetConfigValuesMutation,useGetCapabilitiesQuery,useCreateCapabilityMutation,useUpdateCapabilityMutation,useArchiveCapabilityMutation,useGetEntitlementsQuery,useSetEntitlementMutation,useGetOverridesQuery,useSetOverrideMutation,useGetConfigAuditQuery,useLazyExportConfigQuery}=configApi;
