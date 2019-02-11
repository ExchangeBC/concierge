"use strict";

/**
 * This module exports the Root component.
 * It renders the active "page" component.
 */

import React from "react";
import ReactDOM from "react-dom";
import { Map } from "immutable";
import page from "page";
import routes from "./routes";
import Nav from "./components/Nav";

export default ({ dispatch, state }) => {
  return (
    <div>
      <Nav dispatch={dispatch} user={state.user} />
      <state.view.Component dispatch={dispatch} state={state} params={state.view.params} />
    </div>
  );
};
