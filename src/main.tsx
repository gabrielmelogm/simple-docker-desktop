import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import './index.css'
import { Router } from "./router";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<Router />
		</BrowserRouter>
	</React.StrictMode>,
);
