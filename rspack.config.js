require("dotenv/config");

const path = require("path");

const { rspack } = require("@rspack/core");
const { EntryWrapperPlugin } = require("@seldszar/yael");
const { merge } = require("webpack-merge");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";

  const commonConfig = {
    devtool: isDevelopment ? "inline-cheap-source-map" : false,
    output: {
      path: path.resolve("dist", env.platform),
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".json", ".wasm"],
      tsConfig: path.resolve("tsconfig.json"),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
      ],
    },
    plugins: [
      new rspack.EnvironmentPlugin({
        TWITCH_CLIENT_ID: "",
        TWITCH_REDIRECT_URI: "",
        HOLODEX_API_KEY: "",
      }),
      new rspack.ProvidePlugin({
        browser: "webextension-polyfill",
      }),
      new rspack.CopyRspackPlugin({
        patterns: [
          {
            from: "**/*",
            context: "public",
          },
          {
            from: "**/*",
            context: `overrides/${env.platform}`,
          },
        ],
      }),
    ],
    node: {
      global: false,
    },
  };

  return [
    merge(commonConfig, {
      target: "web",
      entry: {
        popup: "./src/browser/pages/popup.tsx",
        settings: "./src/browser/pages/settings.tsx",
      },
      experiments: {
        css: true,
      },
      plugins: [
        new EntryWrapperPlugin({
          template: "./src/browser/entry-template.tsx",
          test: /\.tsx$/,
        }),
        new rspack.HtmlRspackPlugin({
          template: "./src/browser/entry-template.html",
          filename: "popup.html",
          chunks: ["popup"],
        }),
        new rspack.HtmlRspackPlugin({
          template: "./src/browser/entry-template.html",
          filename: "settings.html",
          chunks: ["settings"],
        }),
      ],
    }),
    merge(commonConfig, {
      target: "webworker",
      entry: {
        background: "./src/background/index.ts",
      },
    }),
  ];
};
