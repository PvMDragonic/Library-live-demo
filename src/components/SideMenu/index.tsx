import { useContext, useEffect, useRef } from "react";
import { ColorModeContext } from "../../components/ColorScheme";
import { useHasScrollbar } from "../../hooks/useHasScrollbar";

interface ISideMenu
{
    children: React.ReactNode;
    showMenu: boolean;
    mainBodyRef: React.RefObject<HTMLDivElement>;
    setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SideMenu({ children, showMenu, mainBodyRef, setShowMenu }: ISideMenu)
{
    const touchStartRef = useRef<number | null>(null);
    const touchEndRef = useRef<number | null>(null);

    const sectionRef = useRef<HTMLDivElement>(null);
    const showMenuRef = useRef<boolean>(false);

    const { hasScroll } = useHasScrollbar({ elementRef: sectionRef })
    const { colorMode } = useContext(ColorModeContext);

    useEffect(() =>
    {
        showMenuRef.current = showMenu;
    }, [showMenu]);

    useEffect(() => 
    {
        // Closes the <SideMenu> when a click happens outside of it.
        function handleDocumentClick(event: MouseEvent)
        {
            // No need to run this all the time if the <SideMenu> is closed.
            if (!showMenuRef.current) return;

            const mainBody = mainBodyRef?.current;
            if (!mainBody) return;

            if (mainBody.contains(event.target as Node)) 
                setShowMenu(false);  
        }

        document.addEventListener('click', handleDocumentClick);

        return () => document.removeEventListener('click', handleDocumentClick);
    }, []);

    useEffect(() =>
    {
        function handleTouchStart(event: TouchEvent)
        {
            touchStartRef.current = event.targetTouches[0].clientX;
            touchEndRef.current = null; // Otherwise, the swipe is fired even with usual touch events.
        }

        function handleTouchMove(event: TouchEvent)
        {
            touchEndRef.current = event.targetTouches[0].clientX;
        }

        function handleTouchEnd()
        {
            const touchStart = touchStartRef.current;
            const touchEnd = touchEndRef.current;
            if (!touchStart || !touchEnd) return;

            const isRightSwipe = (touchStart - touchEnd) < -50;
            if (!showMenu && isRightSwipe && touchStart < window.innerWidth * 0.25) 
                setShowMenu(true);
        }

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd)

        return () => 
        {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
    }, []);

    const showNotShow = showMenu ? 'show' : 'hide';
    const scrollNoScroll = hasScroll ? 'scroll' : 'no-scroll';
    const sectionClass = `side-menu side-menu--${colorMode} side-menu--${showNotShow} side-menu--${scrollNoScroll}`; 

    return (
        <section 
            ref = {sectionRef}
            className = {sectionClass}
        >
            {children}
        </section>
    )
}