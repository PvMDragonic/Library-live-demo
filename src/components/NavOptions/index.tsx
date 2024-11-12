import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ColorModeContext } from "../ColorScheme";

interface INavOptions
{
    sideMenu?: boolean;
}

export function NavOptions({ sideMenu }: INavOptions)
{
    const { colorMode } = useContext(ColorModeContext);
    const { t } = useTranslation();

    const navigate = useNavigate();

    const containerClass = 
        sideMenu === undefined
            ? "navbar__links"
            : "navbar__side-menu-links";

    const buttonClass = `navbar__navigation-button navbar__navigation-button--${colorMode}`;

    return (
        <ul className = {containerClass}>
            <li>
                <a 
                    className = {buttonClass}
                    onClick = {() => navigate('/')}
                >
                    {t('homeNavigationBtn')}
                </a>
            </li>
            <li>
                <a 
                    className = {buttonClass}
                    onClick = {() => navigate('/new')}
                >
                    {t('newBookNavigationBtn')}
                </a>
            </li>
            <li>
                <a 
                    className = {buttonClass}
                    onClick = {() => navigate('/tags')}
                >
                    {t('editTagsNavigationBtn')}
                </a>
            </li>
        </ul>
    )
}