import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, QuerySnapshot, DocumentData } from 'firebase/firestore';

// Firebase configuration from Flutter app
const firebaseConfig = {
  apiKey: 'AIzaSyARnL8-ra0o5JbqVlrkb7cd6s8w_wuwmNk',
  appId: '1:896237748850:web:c81a7d7106eea2ba2238eb',
  messagingSenderId: '896237748850',
  projectId: 'visualtodolizer',
  authDomain: 'visualtodolizer.firebaseapp.com',
  storageBucket: 'visualtodolizer.firebasestorage.app',
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);

export interface Node {
  id: string;
  title: string;
  type: 'panel' | 'text';
  parent: string; // Empty string for root
  content?: string; // For text nodes
  style?: {
    icon?: string; // Lucide icon name (no x/y)
  };
  order?: number; // Order for sorting (lower = first)
  created: Date | Timestamp;
  updated: Date | Timestamp;
}

// Normalize parent value (same as Flutter app)
function normalizeParent(parent: string | null | undefined): string {
  if (parent == null) return '';
  if (parent === 'root') return '';
  return parent;
}

// Convert Firestore timestamp to Date
function toDate(value: any): Date {
  if (value == null) return new Date(0);
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? new Date(0) : new Date(parsed);
  }
  // Try to access millisecondsSinceEpoch (Firestore Timestamp)
  try {
    const ms = (value as any).millisecondsSinceEpoch;
    if (typeof ms === 'number') return new Date(ms);
  } catch (_) {}
  return new Date(0);
}

// Convert Firestore document to Node
function docToNode(docId: string, data: DocumentData): Node {
  return {
    id: docId,
    title: data.title || '',
    type: data.type || 'panel',
    parent: normalizeParent(data.parent),
    content: data.content || undefined,
    style: data.style && typeof data.style === 'object' ? {
      icon: data.style.icon || undefined,
    } : undefined,
    order: typeof data.order === 'number' ? data.order : undefined,
    created: toDate(data.created),
    updated: toDate(data.updated),
  };
}

// Get root nodes (parent === "")
export async function getRootNodes(): Promise<Node[]> {
  const nodesCollection = collection(db, 'node');
  
  // Query for root nodes (parent === "" or null or "root")
  const queries = [
    query(nodesCollection, where('parent', '==', '')),
    query(nodesCollection, where('parent', '==', null)),
    query(nodesCollection, where('parent', '==', 'root')),
  ];

  const snapshots = await Promise.all(queries.map(q => getDocs(q)));
  
  const nodesMap = new Map<string, Node>();
  
  for (const snapshot of snapshots) {
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const normalizedParent = normalizeParent(data.parent);
      if (normalizedParent === '') {
        try {
          nodesMap.set(docSnap.id, docToNode(docSnap.id, data));
        } catch (e) {
          console.warn('Skipping malformed node:', docSnap.id, e);
        }
      }
    });
  }

  // Fallback: if no root nodes found, fetch all and filter client-side
  if (nodesMap.size === 0) {
    const allSnapshot = await getDocs(nodesCollection);
    allSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const normalizedParent = normalizeParent(data.parent);
      if (normalizedParent === '') {
        try {
          nodesMap.set(docSnap.id, docToNode(docSnap.id, data));
        } catch (e) {
          // ignore
        }
      }
    });
  }

  const nodes = Array.from(nodesMap.values());
  // Sort by order (if present), then by created date (newest first)
  nodes.sort((a, b) => {
    // If both have order, sort by order
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only one has order, prioritize it
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // Otherwise sort by created date (newest first)
    const aTime = a.created instanceof Date ? a.created.getTime() : (a.created as Timestamp).toMillis();
    const bTime = b.created instanceof Date ? b.created.getTime() : (b.created as Timestamp).toMillis();
    return bTime - aTime;
  });

  return nodes;
}

// Get child nodes of a parent
export async function getChildNodes(parentId: string): Promise<Node[]> {
  const nodesCollection = collection(db, 'node');
  const q = query(nodesCollection, where('parent', '==', parentId));
  const snapshot = await getDocs(q);

  const nodes: Node[] = [];
  snapshot.forEach((docSnap) => {
    try {
      nodes.push(docToNode(docSnap.id, docSnap.data()));
    } catch (e) {
      console.warn('Skipping malformed node:', docSnap.id, e);
    }
  });

  // Sort by order (if present), then by created date (newest first)
  nodes.sort((a, b) => {
    // If both have order, sort by order
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only one has order, prioritize it
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // Otherwise sort by created date (newest first)
    const aTime = a.created instanceof Date ? a.created.getTime() : (a.created as Timestamp).toMillis();
    const bTime = b.created instanceof Date ? b.created.getTime() : (b.created as Timestamp).toMillis();
    return bTime - aTime;
  });

  return nodes;
}

// Get a single node by ID
export async function getNode(id: string): Promise<Node> {
  const nodeRef = doc(db, 'node', id);
  const nodeSnap = await getDoc(nodeRef);
  
  if (!nodeSnap.exists()) {
    throw new Error(`Node not found: ${id}`);
  }

  return docToNode(nodeSnap.id, nodeSnap.data());
}

// Create a new node
export async function createNode(data: {
  title: string;
  type: 'panel' | 'text';
  parent: string;
  content?: string;
  style?: { icon?: string };
}): Promise<Node> {
  const nodesCollection = collection(db, 'node');
  const now = Timestamp.now();
  
  const nodeData = {
    title: data.title,
    type: data.type,
    parent: normalizeParent(data.parent),
    content: data.content || null,
    style: data.style || null,
    created: now,
    updated: now,
  };

  const docRef = await addDoc(nodesCollection, nodeData);
  return getNode(docRef.id);
}

// Update a node
export async function updateNode(id: string, data: {
  title?: string;
  type?: 'panel' | 'text';
  parent?: string;
  content?: string;
  style?: { icon?: string };
  order?: number;
}): Promise<void> {
  const nodeRef = doc(db, 'node', id);
  const updateData: any = {
    updated: Timestamp.now(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.parent !== undefined) updateData.parent = normalizeParent(data.parent);
  if (data.content !== undefined) updateData.content = data.content || null;
  if (data.style !== undefined) updateData.style = data.style || null;
  if (data.order !== undefined) updateData.order = data.order;

  await updateDoc(nodeRef, updateData);
}

// Update order for multiple nodes (batch update)
export async function updateNodesOrder(updates: { id: string; order: number }[]): Promise<void> {
  const batch = updates.map(({ id, order }) => 
    updateNode(id, { order })
  );
  await Promise.all(batch);
}

// Delete a node
export async function deleteNode(id: string): Promise<void> {
  const nodeRef = doc(db, 'node', id);
  await deleteDoc(nodeRef);
}

// Delete a node and all its children (cascade delete)
export async function deleteNodeCascade(id: string): Promise<void> {
  // First, delete all children
  const children = await getChildNodes(id);
  for (const child of children) {
    await deleteNodeCascade(child.id);
  }
  // Then delete this node
  await deleteNode(id);
}

export default db;
