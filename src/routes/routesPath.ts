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
      EDIT_PATH: "/school-management/:id/edit",
      EDIT: (id:string) => `/school-management/${id}/edit`,
      CREATE: "/school-management/create",
    },
    TEAM_MGT: {
      INDEX: '/team-management',
      EDIT_PATH: "/team-management/:id/edit",
      EDIT: (id:string) => `/team-management/${id}/edit`,
      CREATE: "/team-management/create",
    }
  },
};
