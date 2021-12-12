import { CONTACT_EMAIL, FALLBACK_USER_NAME } from 'front-end/config';
import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Route } from 'front-end/lib/app/types';
import { ProfileComponent, ViewerUser } from 'front-end/lib/components/profiles/types';
import { Component, ComponentView, ComponentViewProps, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, Init, mapComponentDispatch, newRoute, PageComponent, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { updateField, validateField } from 'front-end/lib/views/form-field/lib';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import VerificationStatusBadge from 'front-end/lib/views/verification-status-badge';
import { isArray } from 'lodash';
import { default as React } from 'react';
import { Button, Col, DropdownItem, DropdownMenu, DropdownToggle, Row, Spinner, UncontrolledButtonDropdown } from 'reactstrap';
import { formatTermsAndConditionsAgreementDate } from 'shared/lib';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Profile as ProfileType, profileToName, UserType, userTypeToTitleCase, VerificationStatus, verificationStatusToTitleCase } from 'shared/lib/types';
import { validateEmail } from 'shared/lib/validators';

export interface State<ProfileState> {
  profileLoading: number;
  deactivateLoading: number;
  verificationStatusLoading: number;
  profileUser: PublicUser;
  viewerUser?: ViewerUser;
  userType: ShortText.State;
  email: ShortText.State;
  profile: Immutable<ProfileState>;
  showChangePassword: boolean;
  showReviewTermsAndConditionsLink: boolean;
  showDeactivateAccount: boolean;
  isProfileEditable: boolean;
  isEditingProfile: boolean;
  promptDeactivationConfirmation: boolean;
}

type InnerMsg<ProfileMsg> = ADT<'onChangeEmail', string> | ADT<'onChangeProfile', ProfileMsg> | ADT<'validateEmail'> | ADT<'deactivateAccount'> | ADT<'hideDeactivationConfirmationPrompt'> | ADT<'startEditingProfile'> | ADT<'cancelEditingProfile'> | ADT<'saveProfile'> | ADT<'setVerificationStatus', VerificationStatus>;

export type Msg<ProfileMsg> = GlobalComponentMsg<InnerMsg<ProfileMsg>, Route>;

export interface Params {
  profileUser: PublicUser;
  viewerUser?: ViewerUser;
}

function resetEmailState(user: PublicUser): ShortText.State {
  return ShortText.init({
    id: 'profile-email',
    required: true,
    type: 'email',
    label: 'Account Email Address',
    placeholder: 'Account Email Address',
    value: user.email
  });
}

async function resetProfileState<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>, user: PublicUser): Promise<Immutable<PS>> {
  return immutable(
    await Profile.init({
      profile: user.profile as P
    })
  );
}

function init<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Init<Params, State<PS>> {
  return async (params) => {
    const { profileUser, viewerUser } = params;
    const profileUserIsProgramStaff = profileUser.profile.type === UserType.ProgramStaff;
    const viewerUserIsProgramStaff = !!viewerUser && viewerUser.type === UserType.ProgramStaff;
    const viewerUserIsOwner = !!viewerUser && viewerUser.id === profileUser._id;
    return {
      profileLoading: 0,
      deactivateLoading: 0,
      verificationStatusLoading: 0,
      profileUser,
      viewerUser,
      userType: ShortText.init({
        id: 'profile-user-type',
        required: false,
        type: 'text',
        label: 'Account Type',
        value: userTypeToTitleCase(profileUser.profile.type)
      }),
      email: resetEmailState(profileUser),
      profile: await resetProfileState(Profile, profileUser),
      showChangePassword: viewerUserIsOwner,
      showReviewTermsAndConditionsLink: viewerUserIsOwner,
      showDeactivateAccount: (viewerUserIsOwner && !profileUserIsProgramStaff) || (viewerUserIsProgramStaff && profileUserIsProgramStaff && !viewerUserIsOwner),
      isProfileEditable: viewerUserIsOwner,
      isEditingProfile: false,
      promptDeactivationConfirmation: false
    };
  };
}

function startProfileLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('profileLoading', state.profileLoading + 1);
}

function stopProfileLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('profileLoading', Math.max(state.profileLoading - 1, 0));
}

function startDeactivateLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('deactivateLoading', state.deactivateLoading + 1);
}

function stopDeactivateLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('deactivateLoading', Math.max(state.deactivateLoading - 1, 0));
}

const startVerificationStatusLoading: UpdateState<State<any>> = makeStartLoading('verificationStatusLoading');
const stopVerificationStatusLoading: UpdateState<State<any>> = makeStopLoading('verificationStatusLoading');

function startEditingProfile<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('isEditingProfile', true);
}

function stopEditingProfile<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('isEditingProfile', false);
}

export function update<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Update<State<PS>, Msg<PM>> {
  return ({ state, msg }) => {
    switch (msg.tag) {
      case 'onChangeEmail':
        return [updateField(state, 'email', msg.value)];

      case 'onChangeProfile':
        return updateComponentChild({
          state,
          mapChildMsg: (value: PM) => ({ tag: 'onChangeProfile' as const, value }),
          childStatePath: ['profile'],
          childUpdate: Profile.update,
          childMsg: msg.value
        });

      case 'validateEmail':
        return [validateField(state, 'email', validateEmail)];

      case 'deactivateAccount':
        if (!state.promptDeactivationConfirmation) {
          return [state.set('promptDeactivationConfirmation', true)];
        }
        state = startDeactivateLoading(state).set('promptDeactivationConfirmation', false);
        return [
          state,
          async (state, dispatch) => {
            const result = await api.deleteUser(state.profileUser._id);
            switch (result.tag) {
              case 'valid':
                // Redirect program staff back to the user list if they deactivate an account.
                if (state.viewerUser && state.viewerUser.type === UserType.ProgramStaff) {
                  dispatch(
                    newRoute({
                      tag: 'userList' as const,
                      value: null
                    })
                  );
                } else {
                  // Otherwise, redirect users to the landing page.
                  dispatch(
                    newRoute({
                      tag: 'landing' as const,
                      value: null
                    })
                  );
                }
                return null;
              case 'invalid':
                // TODO show errors
                return stopDeactivateLoading(state);
            }
          }
        ];

      case 'hideDeactivationConfirmationPrompt':
        return [state.set('promptDeactivationConfirmation', false)];

      case 'startEditingProfile':
        return [startEditingProfile(state)];

      case 'cancelEditingProfile':
        state = stopEditingProfile(state);
        return [
          state,
          async () => {
            return state.set('email', resetEmailState(state.profileUser)).set('profile', await resetProfileState(Profile, state.profileUser));
          }
        ];

      case 'saveProfile':
        state = startProfileLoading(state);
        return [
          state,
          async (state) => {
            const result = await api.updateUser({
              id: state.profileUser._id,
              email: state.email.value,
              profile: Profile.getValues(state.profile)
            });
            switch (result.tag) {
              case 'valid':
                state = stopEditingProfile(state)
                  .set('profileUser', result.value)
                  .set('email', resetEmailState(result.value))
                  .set('profile', await resetProfileState(Profile, result.value));
                break;
              case 'invalid':
                const profileErrors = result.value.profile;
                if (profileErrors && !isArray(profileErrors)) {
                  state = state.set('profile', Profile.setErrors(state.profile, profileErrors));
                }
                state = state.setIn(['email', 'errors'], result.value.email || []);
                break;
            }
            state = stopProfileLoading(state);
            return state;
          }
        ];

      case 'setVerificationStatus':
        const verificationStatus = getVerificationStatus(state);
        if (!verificationStatus || !viewerUserIsProgramStaff(state)) {
          return [state];
        }
        state = startVerificationStatusLoading(state);
        return [
          state,
          async (state, dispatch) => {
            const userResult = await api.readOneUser(state.profileUser._id);
            if (userResult.tag === 'invalid') {
              return state;
            }
            state = state.set('profileUser', userResult.value);
            const profile = state.profileUser.profile;
            if (profile.type !== UserType.Buyer) {
              return state;
            }
            const result = await api.updateUser({
              id: state.profileUser._id,
              email: state.profileUser.email,
              profile: {
                ...profile,
                verificationStatus: msg.value
              }
            });
            if (result.tag === 'valid') {
              state = state
                .set('profileUser', result.value)
                .set('email', resetEmailState(result.value))
                .set('profile', await resetProfileState(Profile, result.value));
            }
            state = stopVerificationStatusLoading(state);
            return state;
          }
        ];

      default:
        return [state];
    }
  };
}

function getVerificationStatus<PS>(state: Immutable<State<PS>>): VerificationStatus | null {
  return state.profileUser.profile.type === UserType.Buyer ? state.profileUser.profile.verificationStatus : null;
}

function viewerUserIsProgramStaff<PS>(state: Immutable<State<PS>>): boolean {
  return !!state.viewerUser && state.viewerUser.type === UserType.ProgramStaff;
}

function viewerUserIsOwner<PS>(state: Immutable<State<PS>>): boolean {
  return !!state.viewerUser && state.viewerUser.id === state.profileUser._id;
}

function isInvalid<PS, PM, P extends ProfileType>(state: State<PS>, Profile: ProfileComponent<PS, PM, P>): boolean {
  return !!state.email.errors.length || !Profile.isValid(state.profile);
}

function isValid<PS, PM, P extends ProfileType>(state: State<PS>, Profile: ProfileComponent<PS, PM, P>): boolean {
  const providedRequiredFields = !!state.email.value;
  return providedRequiredFields && !isInvalid(state, Profile);
}

function conditionalVerificationStatusBadge<PS, PM>(): View<ComponentViewProps<State<PS>, Msg<PM>>> {
  return (props) => {
    const { state } = props;
    const buyerStatus = getVerificationStatus(state);
    if (buyerStatus) {
      return <VerificationStatusBadge verificationStatus={buyerStatus} className="mb-3" />;
    } else {
      return null;
    }
  };
}

const ALL_STATUSES = [VerificationStatus.Unverified, VerificationStatus.UnderReview, VerificationStatus.Verified, VerificationStatus.Declined] as const;

function conditionalVerificationStatusDropdown<PS, PM>(): ComponentView<State<PS>, Msg<PM>> {
  return (props) => {
    const { state, dispatch } = props;
    const buyerStatus = getVerificationStatus(state);
    const isLoading = state.verificationStatusLoading > 0;
    if (viewerUserIsProgramStaff(state) && buyerStatus) {
      return (
        <UncontrolledButtonDropdown className="mt-3">
          <DropdownToggle caret color="primary" disabled={isLoading}>
            {isLoading ? <Spinner color="light" size="sm" className="mr-2" /> : 'Set Account Status'}
          </DropdownToggle>
          <DropdownMenu>
            {ALL_STATUSES.map((s, i) => {
              const isDisabled = s === buyerStatus;
              const onClick = () => !isDisabled && dispatch({ tag: 'setVerificationStatus', value: s });
              return (
                <DropdownItem key={`buyer-status-${i}`} onClick={onClick} disabled={isDisabled}>
                  {verificationStatusToTitleCase(s)}
                </DropdownItem>
              );
            })}
          </DropdownMenu>
        </UncontrolledButtonDropdown>
      );
    } else {
      return null;
    }
  };
}

function conditionalEmail<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return (props) => {
    const { state, dispatch } = props;
    const onChangeEmail = ShortText.makeOnChange(dispatch, (value) => ({ tag: 'onChangeEmail' as const, value }));
    const isDisabled = !state.isEditingProfile;
    return (
      <div>
        <Row>
          <Col xs="12" md="6">
            <ShortText.view state={state.userType} onChange={() => null} disabled />
          </Col>
        </Row>
        <Row>
          <Col xs="12" md="6">
            <ShortText.view state={state.email} disabled={isDisabled} onChangeDebounced={() => dispatch({ tag: 'validateEmail', value: undefined })} onChange={onChangeEmail} autoFocus />
          </Col>
        </Row>
      </div>
    );
  };
}

function conditionalTopProfileButtons<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return (props) => {
    const { state, dispatch } = props;
    if (!state.isProfileEditable) {
      return null;
    }
    const isLoading = state.profileLoading > 0;
    const isDisabled = isLoading || !isValid(state, Profile);
    const startEditingProfile = () => !state.isEditingProfile && dispatch({ tag: 'startEditingProfile', value: undefined });
    const cancelEditingProfile = () => state.isEditingProfile && dispatch({ tag: 'cancelEditingProfile', value: undefined });
    const saveProfile = () => state.isEditingProfile && !isDisabled && dispatch({ tag: 'saveProfile', value: undefined });
    if (!state.isEditingProfile) {
      return (
        <div className="d-flex pl-3">
          <Button color="info" size="sm" onClick={startEditingProfile}>
            Edit Profile
          </Button>
        </div>
      );
    } else {
      return (
        <div className="d-flex pl-3">
          <LoadingButton color="primary" size="sm" onClick={saveProfile} loading={isLoading} disabled={isDisabled}>
            Save Changes
          </LoadingButton>
          <Button color="link" size="sm" className="text-secondary" onClick={cancelEditingProfile}>
            Cancel
          </Button>
        </div>
      );
    }
  };
}

function conditionalBottomProfileButtons<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return (props) => {
    const { state, dispatch } = props;
    if (!state.isProfileEditable || !state.isEditingProfile) {
      return null;
    }
    const isLoading = state.profileLoading > 0;
    const isDisabled = isLoading || !isValid(state, Profile);
    const cancelEditingProfile = () => state.isEditingProfile && dispatch({ tag: 'cancelEditingProfile', value: undefined });
    const saveProfile = () => state.isEditingProfile && !isDisabled && dispatch({ tag: 'saveProfile', value: undefined });
    return (
      <Row className="mt-4">
        <Col xs="12">
          <LoadingButton color="primary" onClick={saveProfile} loading={isLoading} disabled={isDisabled}>
            Save Changes
          </LoadingButton>
          <Button color="link" className="text-secondary" onClick={cancelEditingProfile}>
            Cancel
          </Button>
        </Col>
      </Row>
    );
  };
}

function conditionalProfile<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  const ConditionalEmail = conditionalEmail(Profile);
  const ConditionalTopProfileButtons = conditionalTopProfileButtons(Profile);
  const ConditionalBottomProfileButtons = conditionalBottomProfileButtons(Profile);
  return (props) => {
    const { state, dispatch } = props;
    const isDisabled = !state.isEditingProfile;
    const dispatchProfile: Dispatch<PM> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, (value) => ({ tag: 'onChangeProfile' as const, value }));
    return (
      <div className="pb-5">
        <Row className="mb-4">
          <Col xs="12" className="d-flex align-items-center">
            <h2 className="mb-0">Profile</h2>
            <ConditionalTopProfileButtons {...props} />
          </Col>
        </Row>
        <Row>
          <Col xs="12" md="9" lg="8">
            <ConditionalEmail {...props} />
            <Profile.view state={state.profile} dispatch={dispatchProfile} disabled={isDisabled} />
            <ConditionalBottomProfileButtons {...props} />
          </Col>
        </Row>
      </div>
    );
  };
}

function conditionalChangePassword<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state }) => {
    if (!state.showChangePassword) {
      return null;
    }
    return (
      <div className="py-5 border-top">
        <Row>
          <Col xs="12">
            <h2>Change Password</h2>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col xs="12">Click the button below to change your password.</Col>
        </Row>
        <Row>
          <Col xs="12">
            <Link route={{ tag: 'changePassword', value: null }} button color="info">
              Change Password
            </Link>
          </Col>
        </Row>
      </div>
    );
  };
}

function conditionalTermsAndConditions<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state }) => {
    let conditionalLink = null;
    const isOwner = viewerUserIsOwner(state);
    const you = isOwner ? 'You' : profileToName(Profile.getValues(state.profile));
    const have = isOwner ? 'have' : 'has';
    if (state.showReviewTermsAndConditionsLink) {
      conditionalLink = (
        <Row>
          <Col xs="12">
            <Link route={{ tag: 'termsAndConditions', value: {} }}>Review the Terms and Conditions</Link>
          </Col>
        </Row>
      );
    }
    return (
      <div className="py-5 border-top">
        <Row>
          <Col xs="12">
            <h2>Terms and Conditions</h2>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col xs="12">{formatTermsAndConditionsAgreementDate(state.profileUser.acceptedTermsAt, you, have)}</Col>
        </Row>
        {conditionalLink}
      </div>
    );
  };
}

function conditionalDeactivateAccount<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state, dispatch }) => {
    if (!state.showDeactivateAccount) {
      return null;
    }
    const isLoading = state.deactivateLoading > 0;
    const deactivateAccount = () => dispatch({ tag: 'deactivateAccount', value: undefined });
    return (
      <div className="py-5 border-top">
        <Row>
          <Col xs="12">
            <h2>Deactivate Account</h2>
          </Col>
        </Row>
        <Row className="mb-4">
          <Col xs="12">Deactivating your account means that you will no longer be able to access the Concierge.</Col>
        </Row>
        <Row>
          <Col xs="12">
            <LoadingButton onClick={deactivateAccount} color="danger" loading={isLoading} disabled={isLoading}>
              Deactivate Account
            </LoadingButton>
          </Col>
        </Row>
      </div>
    );
  };
}

function view<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  const ConditionalVerificationStatusBadge = conditionalVerificationStatusBadge<PS, PM>();
  const ConditionalVerificationStatusDropdown = conditionalVerificationStatusDropdown<PS, PM>();
  const ConditionalProfile = conditionalProfile(Profile);
  const ConditionalChangePassword = conditionalChangePassword(Profile);
  const ConditionalTermsAndConditions = conditionalTermsAndConditions(Profile);
  const ConditionalDeactivateAccount = conditionalDeactivateAccount(Profile);
  return (props) => {
    const { state } = props;
    const profileName = profileToName(Profile.getValues(state.profile));
    const isOwner = viewerUserIsOwner(state);
    const name: string | null = isOwner ? 'My' : profileName && `${profileName}'s`;
    const headingSuffix = 'Profile';
    const heading = name ? `${name} ${headingSuffix}` : headingSuffix;
    return (
      <div>
        <Row className="mb-5">
          <Col xs="12">
            <ConditionalVerificationStatusBadge {...props} />
            <h1>{heading}</h1>
            <ConditionalVerificationStatusDropdown {...props} />
          </Col>
        </Row>
        <ConditionalProfile {...props} />
        <ConditionalChangePassword {...props} />
        <ConditionalTermsAndConditions {...props} />
        <ConditionalDeactivateAccount {...props} />
      </div>
    );
  };
}

export function component<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Component<Params, State<PS>, Msg<PM>> & Pick<PageComponent<never, never, State<PS>, Msg<PM>>, 'getModal' | 'getAlerts'> {
  return {
    init: init(Profile),
    update: update(Profile),
    view: view(Profile),
    getAlerts(state) {
      const buyerStatus = getVerificationStatus(state);
      const showStatusWarning = viewerUserIsOwner(state) && buyerStatus && buyerStatus !== VerificationStatus.Verified;
      return {
        ...emptyPageAlerts(),
        warnings: showStatusWarning
          ? [
              <span>
                Your access to the Procurement Concierge Program is limited because your account has not yet been verified by the Program's staff. Please contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you have any questions.
              </span>
            ]
          : []
      };
    },
    getModal(state) {
      if (!state.promptDeactivationConfirmation) {
        return null;
      }
      const isOwnAccount = !!state.viewerUser && state.viewerUser.id === state.profileUser._id;
      const your = isOwnAccount ? 'your' : 'this';
      const you = isOwnAccount ? 'you' : profileToName(state.profileUser.profile) || FALLBACK_USER_NAME;
      const my = isOwnAccount ? 'my' : 'this';
      return {
        title: `Deactivate ${your} account?`,
        body: `By deactivating ${your} account, ${you} will no longer be able to sign into the Procurment Concierge web application.`,
        onCloseMsg: { tag: 'hideDeactivationConfirmationPrompt', value: undefined },
        actions: [
          {
            text: `Yes, deactivate ${my} account`,
            color: 'danger',
            button: true,
            msg: { tag: 'deactivateAccount', value: undefined }
          },
          {
            text: 'Cancel',
            color: 'secondary',
            msg: { tag: 'hideDeactivationConfirmationPrompt', value: undefined }
          }
        ]
      };
    }
  };
}
