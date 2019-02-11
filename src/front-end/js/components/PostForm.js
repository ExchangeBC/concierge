"use strict";

import React from "react";
import { Component } from "react";
import Button from "./Button";

export default ({ dispatch, titleBuffer, contentBuffer, submitMsg, submitData = {}, cancelMsg, cancelData = {} }) => {
  return (
    <div className="post-form">
      <input type="text" placeholder="Title" value={titleBuffer} onChange={e => dispatch("updatePostTitleBuffer", { value: e.target.value })} />
      <textarea placeholder="Content" value={contentBuffer} onChange={e => dispatch("updatePostContentBuffer", { value: e.target.value })}></textarea>
      <div className="buttons">
        <Button dispatch={dispatch} clickMsg={cancelMsg} clickData={cancelData} text="Cancel" className="cancel" />
        <Button dispatch={dispatch} clickMsg={submitMsg} clickData={submitData} text="Submit" className="submit" />
      </div>
    </div>
  );
};
