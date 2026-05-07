/**
 * Small "not medical advice" disclaimer rendered at the bottom of every
 * blog page. Kept in one component so the wording can be updated in one place
 * if legal preferences shift.
 */
export function BlogDisclaimer() {
  return (
    <p className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground/80 text-center">
      Content is for informational purposes only and is not medical advice.
    </p>
  )
}
