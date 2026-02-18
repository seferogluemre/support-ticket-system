import { cn } from '#/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer Component
 * 
 * A layout wrapper component for page content with consistent padding and spacing.
 * Use this component to wrap the content of your pages for uniform layout.
 * 
 * @example
 * ```tsx
 * <PageContainer>
 *   <h1>Page Title</h1>
 *   <p>Page content...</p>
 * </PageContainer>
 * ```
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}