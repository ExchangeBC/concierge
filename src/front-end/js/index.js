"use strict";

/**
 * This module is the front-end's imperative shell.
 * It stores the application's state,
 * manages updates to the DOM, and
 * initialises pushState routing.
 */

import "@babel/polyfill"
import React from "react";
import ReactDOM from "react-dom";
import { Map } from "immutable";
import page from "page";
import routes from "./routes";
import Root from "./Root";
import init from "./init";
import update from "./update";

//Helper to render the app into the DOM.
const render = (dispatch, state) => 
  ReactDOM.render(
    <Root dispatch={dispatch} state={state.toJS()} />,
    document.getElementById("main")
  );

//Helper to manage an application's state.
//This is modeled very closely after the Elm architecture.
const createApp = (seed = {}, update, debug = false) => {
  let state = Map(seed);
  const subscriptions = [];
  const subscribe = (fn) => subscriptions.push(fn) && true;
  const unsubscribe = (fn) => remove(subscriptions, a => a == fn) && true;
  const getState = () => state;
  let promise = Promise.resolve();
  const dispatch = (msg, data) => {
    if (debug) console.log("dispatch", msg, data);
    promise = promise
                .then(() => update(state, msg, data))
                .then(newState => {
                  state = newState;
                  subscriptions.forEach(fn => fn(dispatch, state));
                });
  };
  return {
    subscribe,
    unsubscribe,
    getState,
    dispatch
  };
};

//Set up the state machine.
const app = createApp(init, update);
//Re-render whenever state changes.
app.subscribe(render);

//Bind page routes.
routes.forEach(({ path, redirect, auth, Component }) => {
  page(path, ctx => {
    if (redirect) page.redirect(redirect);
    else app.dispatch("view", { auth, Component, params: ctx.params });
  });
});

//Start the router.
page();
