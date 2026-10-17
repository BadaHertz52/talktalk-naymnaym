export function focusHeading(root: ParentNode): boolean {
  const heading = root.querySelector('h1');
  if (!heading) return false;

  heading.setAttribute('tabindex', '-1');
  heading.focus();

  return true;
}
