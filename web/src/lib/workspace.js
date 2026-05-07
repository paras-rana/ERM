export const WORKSPACES = {
  ERM: 'ERM',
  PPM: 'PPM',
};

export const WORKSPACE_OPTIONS = [
  {
    value: WORKSPACES.ERM,
    label: 'ERM',
    name: 'Enterprise Risk Management',
    description: 'Risk matrix, register, and mitigation workflow.',
  },
  {
    value: WORKSPACES.PPM,
    label: 'PPM',
    name: 'Portfolio Performance Management',
    description: 'Portfolio health, delivery status, and funding oversight.',
  },
];

export function isValidWorkspace(value) {
  return Object.values(WORKSPACES).includes(value);
}

export function getWorkspaceMeta(workspace) {
  return (
    WORKSPACE_OPTIONS.find((option) => option.value === workspace) ?? WORKSPACE_OPTIONS[0]
  );
}
