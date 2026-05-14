export const routesPath = {
  AUTH: {
    LOGIN: "/login",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password/:activation_key",
    RESET_PASSWORD_LINK: (key: string) => `/reset-password/${key}`,
    ACTIVATE: "/activate/:activation_key",
    ACTIVATE_LINK: (key: string) => `/activate/${key}`,
    SPECIAL_LOGIN: "/:email/login",
    SPECIAL_LOGIN_LINK: (email: string) => `/${encodeURIComponent(email)}/login`,
  },
  PROTECTED: {
    OVERVIEW: { INDEX: "/overview" },
    SCHOOL_MGT: {
      INDEX: "/school-management",
      CREATE: "/school-management/create",
      VIEW_PATH: "/school-management/:slug/view",
      VIEW: (slug: string) => `/school-management/${slug}/view`,
      EDIT_PATH: "/school-management/:slug/edit",
      EDIT: (slug: string) => `/school-management/${slug}/edit`,
      VIEW_BRANCH_PATH: "/school-management/:slug/branches/:code/view",
      VIEW_BRANCH: (slug: string, code: number) => `/school-management/${slug}/branches/${code}/view`,
      EDIT_BRANCH_PATH: "/school-management/:slug/branches/:code/edit",
      EDIT_BRANCH: (slug: string, code: number) => `/school-management/${slug}/branches/${code}/edit`,
    },
    TEAM_MGT: {
      INDEX: '/team-management',
      EDIT_PATH: "/team-management/:id/edit",
      EDIT: (id:string) => `/team-management/${id}/edit`,
      CREATE: "/team-management/create",
      VIEW_PATH: "/team-management/:id/view",
      VIEW: (id: string) => `/team-management/${id}/view`,
    }
  },
};
