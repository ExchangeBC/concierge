import { default as React, Fragment, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Omit } from 'shared/lib/types';

// Styles.

// TODO

// Utility types and functions.

type Child = ReactElement | string | null;

interface WithChildren {
  children: Child[] | Child;
}

type View<Props extends object> = (props: Props) => ReactElement | null;

type TemplateBaseProps = Omit<LayoutProps, 'children'>;

interface Link {
  text: string;
  url: string;
}

const CallToAction: View<Link> = ({ text, url }) => {
  return (
    <a href={url} target='_blank'>
      {text}
    </a>
  );
};

interface LinkListProps {
  title: string;
  links: Link[];
}

const LinkList: View<LinkListProps> = ({ title, links }) => {
  if (!links.length) { return null; }
  return (
    <Row>
      <b>{title}</b>
      <ul>
        {links.map((link, i) => (
          <li key={`link-list-link-${i}`}>
            <a href={link.url} target='_blank'>{link.text}</a>
          </li>
        ))}
      </ul>
    </Row>
  );
};

type Template<Props extends object> = (props: Props) => string;

function makeTemplate<Props extends object>(Template: View<Props>): Template<Props> {
  return props => renderToStaticMarkup((<Template {...props} />));
}

const Container: View<WithChildren> = ({ children }) => {
  return (
    <table>
      {children}
    </table>
  );
};
const Row: View<WithChildren> = ({ children }) => {
  return (
    <tr>
      <td>
        {children}
      </td>
    </tr>
  );
};

// Email template layout.

interface LayoutProps extends WithChildren {
  logo: {
    src: string;
    url: string;
  };
  title: string;
  description: string;
}

const Layout: View<LayoutProps> = ({ logo, title, description, children }) => {
  return (
    <html>
      <head>
        <meta charSet='utf8' />
      </head>
      <body>
        <Container>
          <Row>
            <a href={logo.url} target='_blank'>
              <img src={logo.src} alt='Procurement Concierge Program Logo' />
            </a>
          </Row>
          <Row>
            {title}
          </Row>
          <Row>
            {description}
          </Row>
          <Fragment>
            {children}
          </Fragment>
        </Container>
      </body>
    </html>
  );
};

// Email templates.

// Generic notification template.

export interface NotificationProps extends TemplateBaseProps {
  linkLists?: LinkListProps[];
  callToAction?: Link;
}

const Notification: View<NotificationProps> = props => {
  const { linkLists, callToAction } = props;
  return (
    <Layout {...props}>
      <Fragment>
        {linkLists
          ? linkLists.map((list, i) => (<LinkList key={`link-list-${i}`} {...list} />))
          : null}
      </Fragment>
      {callToAction
        ? (<CallToAction {...callToAction} />)
        : null}
    </Layout>
  );
};

export const notification: Template<NotificationProps> = makeTemplate(Notification);

// RFI Response Receipt for Program Staff template.

export interface RfiResponseReceivedProps {
  rfi: {
    rfiNumber: string;
    title: string;
    url: string;
  };
  vendor: {
    name: string;
    url: string;
  };
}

const RfiResponseReceived: View<RfiResponseReceivedProps> = ({ rfi, vendor }) => {
  // TODO
  return (
    null
  );
};

export const rfiResponseReceived: Template<RfiResponseReceivedProps> = makeTemplate(RfiResponseReceived);
