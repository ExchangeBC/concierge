"use strict";

import React from "react";
import { Component } from "react";

export default ({ dispatch, clickMsg, clickData = {}, text, className = "" }) => {
  return (
    <button className={className} onClick={() => dispatch(clickMsg, clickData)}>
      {text}
    </button>
  );
};
