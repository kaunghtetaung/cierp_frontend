'use client';

/**
 * Dynamic schema edit page wrapper
 * Handles /core/schema-editor/{id} route
 */

import { useParams } from 'next/navigation';
import SchemaEditPage from '../edit/page';

export default function DynamicSchemaEditPage() {
  const params = useParams();
  const schemaId = params.id as string;

  return <SchemaEditPage schemaId={schemaId} />;
}
