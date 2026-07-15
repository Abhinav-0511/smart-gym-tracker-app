import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window scroll to the top whenever the route changes. The workspace
 * shells stay mounted across in-app navigation (only their active page swaps),
 * so without this the previous page's scroll position carries over to the next
 * one. Runs in a layout effect so the jump happens before the browser paints.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
