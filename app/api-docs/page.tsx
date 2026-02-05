'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import spec from '@/lib/swagger/openapi.json'

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* @ts-expect-error swagger-ui-react types mismatch with React 19 */}
      <SwaggerUI spec={spec} />
    </div>
  )
}
