import { atom } from "recoil";

export const userAtom = atom<any>({
    key: "user",
    default: null,
});
