// Yalnız bu brauzerə aid görünüş tənzimləmələri (backend-də saxlanmır).
export function getBlurProfitDefault(): boolean {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("scrm_blur_profit_default");
    return v === null ? true : v === "1";
}

export function setBlurProfitDefault(value: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem("scrm_blur_profit_default", value ? "1" : "0");
}

// "Ümumi baxış" (Ana səhifə) səhifəsindəki BÜTÜN məbləğlər (gəlir, qazanc, borclar və s.) üçün
// ümumi gizlətmə defolt-u — yuxarıdakı "qazanc" xüsusi defolt-undan ayrıdır, çünki bu, səhifədəki
// hər məbləği əhatə edir (ekranın kiminsə görə biləcəyi yerdə açıq qalanda).
export function getHideAmountsDefault(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("scrm_hide_amounts_default") === "1";
}

export function setHideAmountsDefault(value: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem("scrm_hide_amounts_default", value ? "1" : "0");
}