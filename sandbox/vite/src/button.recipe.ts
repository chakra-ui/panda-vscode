import { defineRecipe } from "@pandacss/dev";

export const button = defineRecipe({
    base: {
        color: "amber.200",
    },
    variants: {
        size: {
            sm: {
                fontSize: "2xl",
            }
        }
    }
})