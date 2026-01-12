import PocketBase from 'pocketbase';

// Initialize the PocketBase client
const pb = new PocketBase('http://127.0.0.1:8090');

export interface Node {
  id: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  title: string;
  type: 'panel' | 'text';
  parent: string; // Relation to another Node
  content?: string; // For text nodes
  style?: {
    shape?: 'circle' | 'square' | 'hexagon';
    color?: string;
    x?: number;
    y?: number;
  };
}

export default pb;
