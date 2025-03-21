import globals from "globals";
import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    {
        rules: {
            indent: ["error", 4, {
                SwitchCase: 1,
            }],

            semi: "error",
            "prefer-const": "error",
            "no-undef": "off",
            "no-unused-vars": "off",

            "arrow-spacing": ["warn", {
                before: true,
                after: true,
            }],

            "comma-dangle": ["error", "always-multiline"],
            "comma-spacing": "error",
            "comma-style": "error",
            curly: ["error", "multi-or-nest", "consistent"],
            "dot-location": ["error", "property"],
            "handle-callback-err": "off",
            "keyword-spacing": "error",

            "max-nested-callbacks": ["error", {
                max: 3,
            }],

            "max-statements-per-line": ["error", {
                max: 3,
            }],

            "no-console": "off",
            "no-empty-function": "error",
            "no-floating-decimal": "error",
            "no-lonely-if": "error",

            "no-multiple-empty-lines": ["error", {
                max: 2,
                maxEOF: 1,
                maxBOF: 0,
            }],

            "no-shadow": ["error", {
                allow: ["err", "error", "e", "resolve", "reject", "buffer"],
            }],

            "no-var": "error",
            "object-curly-spacing": ["error", "always"],
            quotes: ["error", "double"],
            "space-before-blocks": "error",

            "space-before-function-paren": ["error", {
                anonymous: "never",
                named: "never",
                asyncArrow: "always",
            }],

            "space-in-parens": "error",
            "space-infix-ops": "error",
            "spaced-comment": "error",
            yoda: "error",
        },
    },
];