import { getCurrentInstance } from "./component";

export const useSlots = () => {
    return getContext().slots;
};

export const useAttrs = () => {
    return getContext().attrs;
};

export function getContext() {
    const i = getCurrentInstance();
    return i.setupContext;
}
