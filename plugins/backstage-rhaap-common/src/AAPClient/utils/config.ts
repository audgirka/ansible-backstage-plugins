import { Config } from '@backstage/config';
import { readSchedulerServiceTaskScheduleDefinitionFromConfig } from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';

import { AnsibleConfig } from '../../types';

export function getAnsibleConfig(config: Config): AnsibleConfig {
  const ansibleConfig = config.getConfig('ansible');
  const integrations = ScmIntegrations.fromConfig(config);
  const githubIntegration = integrations.github.list()[0].config;
  const gitlabIntegration = integrations.gitlab.list()[0].config;
  const ansibleConfigVales: AnsibleConfig = {
    analytics: {
      enabled: ansibleConfig.getOptionalBoolean('analytics.enabled') ?? false,
    },
    devSpaces: {
      baseUrl: ansibleConfig.getString('devSpaces.baseUrl'),
    },
    automationHub: {
      baseUrl: ansibleConfig.getString('automationHub.baseUrl'),
    },
    rhaap: {
      baseUrl: ansibleConfig.getString('rhaap.baseUrl'),
      token: ansibleConfig.getString('rhaap.token'),
      checkSSL: ansibleConfig.getOptionalBoolean('rhaap.checkSSL') ?? true,
      : {
        type: validateShowCaseType(
          ansibleConfig.getString('rhaap..type'),
        ),
        target: ansibleConfig.getString('rhaap..target'),
        gitBranch: ansibleConfig.getOptionalString(
          'rhaap..gitBranch',
        ),
        gitUser: ansibleConfig.getOptionalString(
          'rhaap..gitUser',
        ),
        gitEmail: ansibleConfig.getOptionalString(
          'rhaap..gitEmail',
        ),
      },
      githubIntegration: githubIntegration,
      gitlabIntegration: gitlabIntegration,
      schedule: readSchedulerServiceTaskScheduleDefinitionFromConfig(
        ansibleConfig.getConfig('rhaap.schedule'),
      ),
      creatorService: {
        baseUrl:
          ansibleConfig.getString('creatorService.baseUrl') ?? 'localhost',
        port: ansibleConfig.getString('creatorService.port') ?? '8000',
      },
    },
  };
  return ansibleConfigVales;
}

function validateShowCaseType(type: string | undefined): 'url' | 'file' {
  return type === 'url' || type === 'file' ? type : 'file';
}
