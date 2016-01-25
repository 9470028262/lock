import Immutable from 'immutable';
import * as l from '../lock/index';
import * as client from '../lock/client/index';

export function initDatabase(model, options) {
  model = model.setIn(
    ["database", "opts"],
    Immutable.fromJS(processDatabaseOptions(options))
  );

  // TODO: remove duplicate connection information
  return l.registerConnection(
    model,
    "database",
    "auth0",
    databaseConnection(model)
  );
}

function processDatabaseOptions(options) {
  let {
    databaseConnection,
    disableResetAction,
    disableSignUpAction,
    loginAfterSignUp,
    resetLink,
    signUpLink,
    usernameStyle
   } = options;

  if (!databaseConnection || typeof databaseConnection !== "string") {
    throw new Error("The `databaseConnection` option needs to be provided.");
  }

  usernameStyle = usernameStyle === "username" ? "username" : "email";

  let activities = ["login", "signUp", "resetPassword"];

  if (disableResetAction != undefined && typeof disableResetAction != "boolean") {
    l.warn(options, "The `disableResetAction` option will be ignored, because it is not a booelan.");
  } else if (disableResetAction) {
    activities = activities.filter(x => x != "resetPassword");
  }

  if (disableSignUpAction != undefined && typeof disableSignUpAction != "boolean") {
    l.warn(options, "The `disableSignUpAction` option will be ignored, because it is not a booelan.");
  } else if (disableSignUpAction) {
    activities = activities.filter(x => x != "signUp");
  }

  if (resetLink != undefined && typeof resetLink != "string") {
    l.warn(options, "The `resetLink` option will be ignored, because it is not a string");
    resetLink = undefined;
  }

  if (signUpLink != undefined && typeof signUpLink != "string") {
    l.warn(options, "The `signUpLink` option will be ignored, because it is not a string");
    signUpLink = undefined;
  }

  loginAfterSignUp = loginAfterSignUp === false ? false : true;

  return {
    activities,
    connection: databaseConnection,
    loginAfterSignUp,
    resetLink,
    signUpLink,
    usernameStyle
  };
}

export function databaseConnection(m) {
  return m.getIn(["database", "opts", "connection"]);
}

export function resetLink(m, notFound="") {
  return m.getIn(["database", "opts", "resetLink"], notFound);
}

export function signUpLink(m, notFound="") {
  return m.getIn(["database", "opts", "signUpLink"], notFound);
}

export function setActivity(m, name) {
  return l.clearGlobalSuccess(l.clearGlobalError(m.set("activity", name)));
}

export function getActivity(m) {
  return m.get("activity", m.getIn(["database", "opts", "activities", 0]));
}

export function authWithUsername(m) {
  return m.getIn(["database", "opts", "usernameStyle"]) === "username";
}

export function hasActivity(m, s) {
  return m.getIn(["database", "opts", "activities"]).contains(s);
}

export function shouldAutoLogin(m) {
  return m.getIn(["database", "opts", "loginAfterSignUp"]);
}

export function passwordStrengthPolicy(m) {
  return client
    .connection(m, "auth0", databaseConnection(m))
    .get("passwordPolicy", "none");
}