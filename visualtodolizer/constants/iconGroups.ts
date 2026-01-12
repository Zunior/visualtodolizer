export interface IconGroup {
  id: string;
  name: string;
  description: string;
  canvasIcons: string[]; // Icons for panel/container nodes
  textIcons: string[]; // Icons for text/item nodes
}

export const ICON_GROUPS: IconGroup[] = [
  {
    id: 'project-task',
    name: 'Project & Task Management',
    description: 'Sprints, Roadmaps, To-Do lists',
    canvasIcons: ['briefcase', 'square-kanban', 'target', 'milestone', 'flag'],
    textIcons: [
      'circle',
      'check-circle-2',
      'clock',
      'alert-triangle',
      'user',
      'calendar',
      'paperclip',
      'message-square',
      'tag',
      'list-todo',
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering & Development',
    description: 'System architecture, code repositories, API mapping',
    canvasIcons: ['server', 'box', 'database', 'cloud', 'network'],
    textIcons: [
      'code-2',
      'bug',
      'terminal',
      'git-branch',
      'git-pull-request',
      'globe',
      'file-json',
      'lock',
      'workflow',
      'cpu',
    ],
  },
  {
    id: 'crm-sales',
    name: 'CRM & Sales',
    description: 'Customer lists, deal pipelines, contact books',
    canvasIcons: ['building-2', 'users', 'factory', 'store', 'landmark'],
    textIcons: [
      'user',
      'phone',
      'mail',
      'map-pin',
      'dollar-sign',
      'file-text',
      'linkedin',
      'calendar-days',
      'sticky-note',
      'percent',
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge Base (Wiki)',
    description: 'Documentation, research, study notes, "Second Brain"',
    canvasIcons: ['book', 'library', 'folder-open', 'graduation-cap', 'archive'],
    textIcons: [
      'lightbulb',
      'quote',
      'link',
      'file',
      'image',
      'video',
      'list',
      'help-circle',
      'bookmark',
      'pencil',
    ],
  },
  {
    id: 'design-creative',
    name: 'Product Design & Creative',
    description: 'UX flows, asset management, mood boards',
    canvasIcons: ['palette', 'layout-template', 'pen-tool', 'figma', 'camera'],
    textIcons: [
      'image',
      'layers',
      'type',
      'droplet',
      'scissors',
      'play-circle',
      'smartphone',
      'monitor',
      'wand-2',
      'check',
    ],
  },
  {
    id: 'personal',
    name: 'Personal Life & Planning',
    description: 'Travel planning, habit tracking, finance',
    canvasIcons: ['home', 'heart', 'plane', 'shopping-bag', 'utensils'],
    textIcons: [
      'check-square',
      'credit-card',
      'shopping-cart',
      'receipt',
      'ticket',
      'gift',
      'book-open',
      'film',
      'pill',
      'map',
    ],
  },
];

// Helper function to get icons for a specific group and node type
export function getIconsForGroupAndType(
  groupId: string,
  nodeType: 'panel' | 'text'
): string[] {
  const group = ICON_GROUPS.find((g) => g.id === groupId);
  if (!group) return [];
  return nodeType === 'panel' ? group.canvasIcons : group.textIcons;
}

// Helper function to get group by ID
export function getGroupById(groupId: string): IconGroup | undefined {
  return ICON_GROUPS.find((g) => g.id === groupId);
}
