import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"

import Home from "./Home"
import App from "./App"
import Info from "./Info"       
import "./index.css"

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/studio", element: <App /> },
  { path: "/info", element: <Info /> },   
  { path: "*", element: <Home /> },       
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
