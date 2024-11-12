import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ColorModeContext } from "../ColorScheme";
import LoadingIcon from "../../assets/LoadingIcon";

export function Loading()
{
    const { colorMode } = useContext(ColorModeContext);
    const { t } = useTranslation();

    return (
        <section className = {`loading loading--${colorMode}`}>
            <h1 className = {`loading__text loading__text--${colorMode}`}>
                {t('loadingText')}
            </h1>
            <LoadingIcon/>
        </section>   
    )
}