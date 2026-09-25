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