export const routesPath = {
  AUTH: {
    LOGIN: "/login",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password/:activation_key",
    RESET_PASSWORD_LINK: (key: string) => `/reset-password/${key}`,
    ACTIVATE: "/activate/:activation_key",
    ACTIVATE_LINK: (key: string) => `/activate/${key}`,
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
