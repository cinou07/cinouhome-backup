import { onRequestGet as __api_comments_js_onRequestGet } from "C:\\Users\\pc\\Downloads\\cinouhome-fixed\\functions\\api\\comments.js"
import { onRequestPost as __api_comments_js_onRequestPost } from "C:\\Users\\pc\\Downloads\\cinouhome-fixed\\functions\\api\\comments.js"
import { onRequestPost as __api_like_js_onRequestPost } from "C:\\Users\\pc\\Downloads\\cinouhome-fixed\\functions\\api\\like.js"

export const routes = [
    {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_comments_js_onRequestGet],
    },
  {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_comments_js_onRequestPost],
    },
  {
      routePath: "/api/like",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_like_js_onRequestPost],
    },
  ]