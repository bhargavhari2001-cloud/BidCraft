// Ref-counted body-scroll lock. Multiple independent UI pieces (a modal, the
// mobile nav, the logo intro) may each want to prevent scroll at once; a
// naive `document.body.style.overflow = "hidden" | ""` in each of them stomps
// on the others — whichever effect runs last wins, and unlocking one
// re-enables scroll even if another is still active. This coordinates them
// through a single counter and restores the value that was actually there
// before the first lock, rather than assuming "" is the resting state.
let lockCount = 0;
let previousOverflow: string | null = null;

export function acquireScrollLock(): () => void {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount++;

  let released = false;
  return function release() {
    if (released) return;
    released = true;
    lockCount--;
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow ?? "";
      previousOverflow = null;
    }
  };
}
