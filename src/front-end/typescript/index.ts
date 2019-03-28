import app from 'front-end/lib/app/index';
import { start } from 'front-end/lib/framework';
import { debounce, set, throttle } from 'lodash';

const element = document.getElementById('main') || document.body;
const debug = false;
start(app, element, debug)
  .then(stateManager => {
    // Store stateManager on the window in development.
    if (debug) { set(window, 'stateManager', stateManager); }
    // Throttle DOM queries.
    const querySelector = throttle((selector: string) => document.querySelector(selector), 500);

    // Update the bottom CSS position of fixed bars.
    function dispatchFixedBarBottom(): void {
      const footer = querySelector('footer');
      if (!footer) { return; }
      const fixedBarBottom = Math.max(0, window.innerHeight - (footer.offsetTop - window.scrollY));
      stateManager.dispatch({
        tag: 'updateFixedBarBottom',
        value: fixedBarBottom
      });
    }

    const debouncedDispatchFixedBarBottom = debounce(dispatchFixedBarBottom, 200);
    const debouncedDispatchFixedBarBottomSlow = debounce(dispatchFixedBarBottom, 1000);

    window.addEventListener('scroll', event => {
      debouncedDispatchFixedBarBottom();
    })

    window.addEventListener('resize', event => {
      debouncedDispatchFixedBarBottom();
    })

    stateManager.msgSubscribe(msg => {
      switch (msg.tag) {
        case '@incomingPage':
        case 'toggleIsNavOpen':
          debouncedDispatchFixedBarBottom();
          break;
        case 'pageSignUpBuyer':
        case 'pageSignUpVendor':
        case 'pageSignUpProgramStaff':
        case 'pageTermsAndConditions':
        case 'pageRequestForInformationCreate':
          // Ensure this subscription is not mutually recursive.
          if (msg.value.tag !== 'updateFixedBarBottom') {
            debouncedDispatchFixedBarBottomSlow();
          }
          break;
        default:
          break;
      }
    });

    // Dispatch initial events.
    debouncedDispatchFixedBarBottom();
  });
