/**
 * Navigation Tree Utilities
 * Pure helper functions for tree manipulation (no React dependencies)
 */

import type { MenuTreeNode } from '../common/types';

/**
 * Find the siblings array and index for a given node ID.
 * Walks the tree recursively and returns the array containing the node
 * along with the node's position within that array.
 */
export function findSiblingsAndIndex(
  tree: MenuTreeNode[],
  nodeId: string
): { siblings: MenuTreeNode[]; index: number } | null {
  const topIdx = tree.findIndex((n) => n._id === nodeId);
  if (topIdx !== -1) {
    return { siblings: tree, index: topIdx };
  }
  for (const node of tree) {
    if (node.children?.length) {
      const result = findSiblingsAndIndex(node.children, nodeId);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Find a node by ID in the tree.
 */
export function findNodeById(
  tree: MenuTreeNode[],
  nodeId: string
): MenuTreeNode | null {
  for (const node of tree) {
    if (node._id === nodeId) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find the parent node of a given node ID.
 * Returns null if the node is at root level.
 */
export function findParentNode(
  tree: MenuTreeNode[],
  nodeId: string
): MenuTreeNode | null {
  for (const node of tree) {
    if (node.children?.some((c) => c._id === nodeId)) {
      return node;
    }
    if (node.children?.length) {
      const found = findParentNode(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get the previous sibling of a node.
 */
export function getPreviousSibling(
  tree: MenuTreeNode[],
  nodeId: string
): MenuTreeNode | null {
  const result = findSiblingsAndIndex(tree, nodeId);
  if (!result || result.index === 0) return null;
  return result.siblings[result.index - 1];
}

/**
 * Check if a node can move up (not first among siblings).
 */
export function canMoveUp(tree: MenuTreeNode[], nodeId: string): boolean {
  const result = findSiblingsAndIndex(tree, nodeId);
  return result !== null && result.index > 0;
}

/**
 * Check if a node can move down (not last among siblings).
 */
export function canMoveDown(tree: MenuTreeNode[], nodeId: string): boolean {
  const result = findSiblingsAndIndex(tree, nodeId);
  return result !== null && result.index < result.siblings.length - 1;
}

/**
 * Check if a node can be made a sub-item (has a previous sibling).
 */
export function canMakeSubItem(tree: MenuTreeNode[], nodeId: string): boolean {
  return getPreviousSibling(tree, nodeId) !== null;
}

/**
 * Check if a node can be promoted (has a parent, i.e., not at root level).
 */
export function canPromote(tree: MenuTreeNode[], nodeId: string): boolean {
  return findParentNode(tree, nodeId) !== null;
}

/**
 * Build the reorder DTO for a siblings array.
 * Returns an array of IDs in the desired order.
 * Backend determines order from array index position.
 */
export function buildReorderIds(siblings: MenuTreeNode[]): string[] {
  return siblings.map((node) => node._id);
}
