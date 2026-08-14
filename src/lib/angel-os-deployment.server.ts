import { AngelOSAdapterRegistry } from '../../angel-os/core/adapter-registry';
import { githubServerAdapter, type AngelGitHubClient } from '../../angel-os/adapters/github.server';
import { vercelServerAdapter, type AngelVercelClient } from '../../angel-os/adapters/vercel.server';

const adapters = new AngelOSAdapterRegistry();
adapters.register(githubServerAdapter);
adapters.register(vercelServerAdapter);

export async function triggerAngelOSPrebuiltDeployment() {
  const github = await adapters.connect<AngelGitHubClient>('angel.provider.github');
  await github.dispatchWorkflow(
    'angelosmegaplus',
    'angel-leclerc',
    'vercel-prebuilt.yml',
    'main',
  );
  return { queued: true, provider: 'github-actions', workflow: 'vercel-prebuilt.yml' } as const;
}

export async function getAngelOSDeploymentState() {
  const vercel = await adapters.connect<AngelVercelClient>('angel.provider.vercel');
  const projectId = process.env.VERCEL_PROJECT_ID ?? 'prj_TZoiBkJM3z1knPE6Pc1V854CwrNe';
  const teamId = process.env.VERCEL_ORG_ID ?? 'team_V2zZ6Gj9Vt3ULjCO6ssDbqwM';
  const [project, deployments] = await Promise.all([
    vercel.getProject(projectId, teamId),
    vercel.listDeployments(projectId, teamId),
  ]);
  return { project, deployments };
}
