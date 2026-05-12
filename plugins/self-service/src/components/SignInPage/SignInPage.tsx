import {
  SignInPageProps,
  useApi,
  configApiRef,
} from '@backstage/core-plugin-api';
import {
  SignInPage as BackstageSignInPage,
  SignInProviderConfig,
  IdentityProviders,
} from '@backstage/core-components';
import { githubAuthApiRef, gitlabAuthApiRef } from '@backstage/core-plugin-api';
import { rhAapAuthApiRef } from '../../apis';

const providerMap = new Map<string, SignInProviderConfig>([
  [
    'rhaap',
    {
      id: 'rhaap',
      title: 'Ansible Automation Platform',
      message: 'Sign in using Ansible Automation Platform',
      apiRef: rhAapAuthApiRef,
    },
  ],
  [
    'github',
    {
      id: 'github-auth-provider',
      title: 'GitHub',
      message: 'Sign in using GitHub',
      apiRef: githubAuthApiRef,
    },
  ],
  [
    'gitlab',
    {
      id: 'gitlab-auth-provider',
      title: 'GitLab',
      message: 'Sign in using GitLab',
      apiRef: gitlabAuthApiRef,
    },
  ],
]);

const DEFAULT_PROVIDER = 'rhaap';

export function SignInPage(props: SignInPageProps): React.JSX.Element {
  const configApi = useApi(configApiRef);
  const isDevEnv = configApi.getString('auth.environment') === 'development';

  const enabledProviders =
    configApi.getOptionalStringArray('ansible.auth.enabledProviders') ?? [];

  let providers: IdentityProviders;

  if (enabledProviders.length > 0) {
    providers = enabledProviders
      .filter(key => providerMap.has(key))
      .map(key => providerMap.get(key)!);
  } else {
    const signInProvider =
      configApi.getOptionalString('signInPage') ?? DEFAULT_PROVIDER;
    const config =
      providerMap.get(signInProvider) ?? providerMap.get(DEFAULT_PROVIDER)!;
    providers = [config];
  }

  if (isDevEnv) {
    providers.push('guest');
  }

  return (
    <BackstageSignInPage
      {...props}
      align="center"
      title="Select a Sign-in method"
      providers={providers}
    />
  );
}
