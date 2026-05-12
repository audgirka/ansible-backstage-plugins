export interface Config {
  /** Configurations for the Ansible plugin */
  ansible?: {
    /**
     * Auth configuration for the sign-in page.
     * For internal/development use only.
     * @deepVisibility frontend
     */
    auth?: {
      /**
       * Override the default sign-in page to show multiple auth providers.
       * When not set, the sign-in page shows the provider from the
       * top-level signInPage config (defaults to rhaap). Guest is
       * added automatically when auth.environment is 'development'.
       * Supported values: rhaap, github, gitlab.
       * @visibility frontend
       */
      enabledProviders?: string[];
    };
    /**
     * AAP base URL
     * @deepVisibility frontend
     */
    rhaap?: {
      /**
       * @visibility frontend
       */
      baseUrl?: string;
    };
    /**
     * Feedback form configuration
     * @deepVisibility frontend
     */
    feedback?: {
      /**
       * Enable or disable the feedback form. Defaults to true.
       * @visibility frontend
       */
      enabled?: boolean;
    };
  };
}
