import { CONTACT_EMAIL, MAILER_ROOT_URL } from 'back-end/config';
import { CSSProperties, default as React, Fragment, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Omit, Rating, ratingToTitleCase, UserType, userTypeToTitleCase, VerificationStatus, verificationStatusToTitleCase } from 'shared/lib/types';

// Styles.

type StyleVariables = Record<string, Record<string, string>>;

type StyleUtilities = Record<string, Record<string, CSSProperties>>;

type StyleClasses = Record<string, CSSProperties>;

type CSSProperty = keyof CSSProperties;

type StyleUnit = 'px' | 'rem';

type StyleLevel = 0 | 1 | 2 | 3 | 4 | 5;

const STYLE_LEVELS: StyleLevel[] = [0, 1, 2, 3, 4, 5];

type StyleLevelUtilities = {
  [level in StyleLevel]: CSSProperties;
};

export const styles = (() => {
  const spacer = 16;
  const scale = (n: number) => n * spacer;
  const units = (n: number | string, unit: StyleUnit) => `${n}${unit}`;
  const px = (n: number | string) => units(n, 'px');
  const style = (property: string, value: string) => ({ [property]: value });
  const styleScale = (property: string, n: number, unit: StyleUnit = 'px') => style(property, units(scale(n), unit));
  const level = (l: StyleLevel) => {
    switch (l) {
      case 0:
        return 0;
      case 1:
        return 0.25;
      case 2:
        return 0.5;
      case 3:
        return 1;
      case 4:
        return 2;
      case 5:
        return 3;
    }
  };

  const levelUtilities = (property: CSSProperty): StyleLevelUtilities => {
    return STYLE_LEVELS.reduce((acc, l) => {
      acc[l] = styleScale(property, level(l));
      return acc;
    }, {} as StyleLevelUtilities);
  };
  const variables: StyleVariables = {
    sizes: {
      borderRadius: px(scale(0.25))
    },
    colors: {
      primary: '#003366',
      action: '#0c99d6',
      white: '#fff'
    }
  };
  const utilities: StyleUtilities = {
    p: levelUtilities('padding'),
    pt: levelUtilities('paddingTop'),
    pr: levelUtilities('paddingRight'),
    pb: levelUtilities('paddingBottom'),
    pl: levelUtilities('paddingLeft'),
    m: levelUtilities('margin'),
    mt: levelUtilities('marginTop'),
    mr: levelUtilities('marginRight'),
    mb: levelUtilities('marginBottom'),
    ml: levelUtilities('marginLeft'),
    text: {
      left: { textAlign: 'left' },
      right: { textAlign: 'right' },
      center: { textAlign: 'center' }
    },
    font: {
      sans: { fontFamily: 'sans-serif' },
      sm: { fontSize: px(scale(0.9)) },
      md: { fontSize: px(scale(1)) },
      lg: { fontSize: px(scale(1.1)) },
      xl: { fontSize: px(scale(1.3)) },
      bold: { fontWeight: 'bold' }
    },
    border: {
      radius: {
        borderRadius: variables.sizes.borderRadius
      }
    }
  };
  const classes: StyleClasses = {
    body: {
      ...utilities.m[0],
      ...utilities.p[0],
      ...utilities.font.sans,
      ...utilities.font.md,
      backgroundColor: variables.colors.white,
      width: '100%'
    },
    table: {
      ...utilities.pt[4],
      ...utilities.pb[4],
      ...utilities.pr[3],
      ...utilities.pl[3],
      margin: '0 auto',
      border: 0,
      width: '100%',
      lineHeight: 1.4
    },
    row: {
      ...utilities.pt[3],
      ...utilities.pb[3]
    },
    title: {
      ...utilities.font.xl,
      ...utilities.font.bold,
      ...utilities.pt[4],
      ...utilities.text.left
    },
    description: {
      ...utilities.text.left
    },
    p: {
      ...utilities.mt[1],
      ...utilities.mb[1]
    },
    linkListTitle: {
      ...utilities.font.bold
    },
    descriptionListTitle: {
      ...utilities.font.bold,
      ...utilities.mb[3]
    },
    linkListLink: {
      ...utilities.m[0],
      ...utilities.p[0],
      ...utilities.mt[3],
      ...utilities.mb[3]
    },
    link: {
      color: variables.colors.action,
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    button: {
      ...utilities.border.radius,
      ...utilities.font.lg,
      ...utilities.text.center,
      padding: `${px(scale(0.75))} ${px(scale(1.5))}`,
      margin: '0 auto',
      backgroundColor: variables.colors.action,
      color: variables.colors.white,
      cursor: 'pointer',
      display: 'inline-block',
      textDecoration: 'none'
    },
    logoBackground: {
      ...utilities.border.radius,
      ...utilities.p[3],
      ...utilities.text.center,
      backgroundColor: variables.colors.primary,
      display: 'inline-flex'
    },
    logo: {
      height: px(scale(2))
    }
  };
  return {
    variables,
    utilities,
    classes,
    helpers: {
      spacer,
      scale,
      units,
      px,
      style,
      styleScale
    }
  };
})();

// Utility types and functions.

export function makeUrl(path: string): string {
  return `${MAILER_ROOT_URL}/${path.replace(/^\/*/, '')}`;
}

type Child = ReactElement | string | null;

interface WithChildren {
  children: Child[] | Child;
}

interface WithStyle {
  style: CSSProperties;
}

export type View<Props> = (props: Props) => ReactElement | null;

type TemplateBaseProps = Omit<LayoutProps, 'children'>;

export interface LinkProps {
  text: string;
  url: string;
}

export const Link: View<LinkProps> = ({ text, url }) => {
  return (
    <a href={url} target="_blank" style={styles.classes.link}>
      {text}
    </a>
  );
};

const CallToAction: View<LinkProps> = ({ text, url }) => {
  return (
    <Row style={styles.utilities.text.left}>
      <a href={url} target="_blank" style={styles.classes.button}>
        {text}
      </a>
    </Row>
  );
};

interface LinkListProps {
  title?: string;
  links: LinkProps[];
}

const LinkList: View<LinkListProps> = ({ title, links }) => {
  if (!links.length) {
    return null;
  }
  return (
    <Row style={styles.utilities.text.left}>
      {title ? <div style={styles.classes.linkListTitle}>{title}</div> : null}
      <Fragment>
        {links.map((link, i) => (
          <div key={`link-list-link-${i}`} style={styles.classes.linkListLink}>
            <Link {...link} />
          </div>
        ))}
      </Fragment>
    </Row>
  );
};

interface DescriptionItemProps {
  name: string;
  value: string;
}

const DescriptionItem: View<DescriptionItemProps> = ({ name, value }) => {
  return (
    <p style={styles.classes.p}>
      <b>{name}:&nbsp;</b>
      {value}
    </p>
  );
};

export interface DescriptionListProps {
  title?: string;
  items: DescriptionItemProps[];
}

const DescriptionList: View<DescriptionListProps> = ({ title, items }) => {
  return (
    <Row style={styles.utilities.text.left}>
      {title ? <div style={styles.classes.descriptionListTitle}>{title}</div> : null}
      <Fragment>
        {items.map((item, i) => (
          <DescriptionItem key={`dl-di-${i}`} {...item} />
        ))}
      </Fragment>
    </Row>
  );
};

type Template<Props> = (props: Props) => string;

function makeTemplate<Props>(Template: View<Props>): Template<Props> {
  return (props) => renderToStaticMarkup(<Template {...props} />);
}

const Container: View<WithChildren> = ({ children }) => {
  return <table style={styles.classes.table}>{children}</table>;
};

const Row: View<WithChildren & Partial<WithStyle>> = ({ children, style = {} }) => {
  return (
    <tr>
      <td style={{ ...styles.classes.row, ...style }}>{children}</td>
    </tr>
  );
};

// Email template layout.

interface LayoutProps extends WithChildren {
  title: string | ReactElement;
  description?: string | ReactElement;
}

const Layout: View<LayoutProps> = ({ title, description, children }) => {
  return (
    <html style={styles.classes.body}>
      <head>
        <meta charSet="utf8" />
      </head>
      <body style={styles.classes.body}>
        <Container>
          <Row style={styles.classes.row}>
            <a href={makeUrl('')} target="_blank" style={styles.classes.logoBackground}>
              <img src={makeUrl('images/logo.svg')} alt="Procurement Concierge Program Logo" style={styles.classes.logo} />
            </a>
          </Row>
          <Row style={styles.classes.title}>{title}</Row>
          {description ? <Row style={styles.classes.description}>{description}</Row> : null}
          <Fragment>{children}</Fragment>
        </Container>
      </body>
    </html>
  );
};

// Email templates.

// Simple template.

export interface SimpleProps extends TemplateBaseProps {
  linkLists?: LinkListProps[];
  descriptionLists?: DescriptionListProps[];
  callToAction?: LinkProps;
}

const Simple: View<SimpleProps> = (props) => {
  const { linkLists, descriptionLists, callToAction } = props;
  return (
    <Layout {...props}>
      <Fragment>{linkLists ? linkLists.map((list, i) => <LinkList key={`link-list-${i}`} {...list} />) : null}</Fragment>
      <Fragment>{descriptionLists ? descriptionLists.map((list, i) => <DescriptionList key={`description-list-${i}`} {...list} />) : null}</Fragment>
      {callToAction ? <CallToAction {...callToAction} /> : null}
    </Layout>
  );
};

export const simple: Template<SimpleProps> = makeTemplate(Simple);

// RFI Response Receipt for Program Staff template.

export interface RfiResponseReceivedProps {
  rfi: {
    rfiNumber: string;
    title: string;
    id: string;
  };
  vendor: {
    name: string;
    id: string;
  };
  attachments: Array<{ name: string; id: string }>;
}

const RfiResponseReceived: View<RfiResponseReceivedProps> = ({ rfi, vendor, attachments }) => {
  const vendorUrl = makeUrl(`users/${vendor.id}`);
  const rfiUrl = makeUrl(`requests-for-information/${rfi.id}`);
  const VendorLink = () => <Link url={vendorUrl} text={vendor.name} />;
  const RfiLink = () => <Link url={rfiUrl} text={`${rfi.rfiNumber}: ${rfi.title}`} />;
  const attachmentLinks = attachments.map(({ name, id }) => ({
    text: name,
    url: makeUrl(`api/fileBlobs/${id}`)
  }));
  const description = (
    <div>
      <p>
        A response has been submitted by <VendorLink /> to <RfiLink />.
      </p>
      <p>
        Please note that you will only be able to view this Vendor's profile and download their response's attachments if you have already signed into your Program Staff account in the Procurement Concierge web application. <Link text="Click here to sign in" url={makeUrl('sign-in')} />.
      </p>
    </div>
  );
  return (
    <Layout title="RFI Response Received" description={description}>
      {attachments.length ? <LinkList links={attachmentLinks} title="Attachments" /> : null}
    </Layout>
  );
};

export const rfiResponseReceived: Template<RfiResponseReceivedProps> = makeTemplate(RfiResponseReceived);

// Feedback template.

export interface FeedbackProps {
  userType?: UserType;
  rating: Rating;
  text: string;
}

const Feedback: View<FeedbackProps> = ({ userType, rating, text }) => {
  const descriptionItems: DescriptionItemProps[] = [{ name: 'Rating', value: ratingToTitleCase(rating) }];
  if (userType) {
    descriptionItems.unshift({ name: 'User Type', value: userTypeToTitleCase(userType) });
  }
  return (
    <Layout title="Feedback Received">
      <DescriptionList items={descriptionItems} />
      <Row>
        <div style={styles.utilities.font.lg}>{text}</div>
      </Row>
    </Layout>
  );
};

export const feedback: Template<FeedbackProps> = makeTemplate(Feedback);

// Buyer Status Updated template.

export interface BuyerStatusUpdatedProps {
  verificationStatus: VerificationStatus;
}

const BuyerStatusUpdated: View<BuyerStatusUpdatedProps> = ({ verificationStatus }) => {
  const description = (() => {
    switch (verificationStatus) {
      case VerificationStatus.Verified:
        return (
          <span>
            Your {userTypeToTitleCase(UserType.Buyer)} account has been <b>verified</b>. If you have agreed to the <Link text="Terms & Conditions" url={makeUrl('terms-and-conditions')} />, you will be able to access all of the Procurement Concierge Program's features.
          </span>
        );
      case VerificationStatus.Declined:
        return (
          <span>
            Your {userTypeToTitleCase(UserType.Buyer)} account has been <b>declined</b>. If you have any questions, please email {CONTACT_EMAIL}.
          </span>
        );
      case VerificationStatus.UnderReview:
      case VerificationStatus.Unverified:
        return (
          <span>
            Your {userTypeToTitleCase(UserType.Buyer)} account is now "<b>{verificationStatusToTitleCase(verificationStatus)}</b>". If you have any questions, please email {CONTACT_EMAIL}.
          </span>
        );
    }
  })();
  return <Simple title="Account Status Updated" description={description} />;
};

export const buyerStatusUpdated: Template<BuyerStatusUpdatedProps> = makeTemplate(BuyerStatusUpdated);

// Deactivate user.

export interface DeactivateUserProps {
  userType: UserType;
}

const DeactivateUser: View<DeactivateUserProps> = ({ userType }) => {
  const description = (
    <div>
      <p>Your Procurement Concierge Program account has been deactivated. You no longer have access to the program's web application.</p>
      {userType !== UserType.ProgramStaff ? <p>If you would like to return to the Procurement Concierge Program's web application, you can reactivate your account at any time by logging in with your email and password.</p> : null}
    </div>
  );
  return <Simple title="Your Account has been Deactivated" description={description} />;
};

export const deactivateUser: Template<DeactivateUserProps> = makeTemplate(DeactivateUser);
