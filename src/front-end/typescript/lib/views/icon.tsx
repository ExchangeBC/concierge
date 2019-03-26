import { View } from 'front-end/lib/framework';
import { BootstrapColor } from 'front-end/lib/types';
import { CSSProperties, default as React, ReactElement } from 'react';

export type AvailableIcons
  = 'chevron-left'
  | 'calendar'
  | 'check'
  | 'help-circle'
  | 'trash'
  | 'paperclip'
  | 'rfi'
  | 'matchmaking'
  | 'discovery-day';

interface Props {
  name: AvailableIcons;
  color: BootstrapColor;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
}

interface SvgProps extends Props {
  children: Array<ReactElement<any>> | ReactElement<any>;
}

const Feather: View<SvgProps> = props => {
  const { color, width = 1.25, height = 1.25, className = '', style = {}, children } = props;
  return (
    <svg xmlns='http://www.w3.org/2000/svg' style={{ ...style, width: `${width}rem`, height: `${height}rem` }} viewBox='0 0 24 24' fill='none' stroke='currentColor' className={`icon text-${color} ${className}`} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
      {children}
    </svg>
  );
};

interface FontAwesomeProps extends SvgProps {
  viewBox: string;
}

const FontAwesome: View<FontAwesomeProps> = props => {
  const { color, width = 1.25, height = 1.25, viewBox, className = '', style = {}, children } = props;
  return (
    <svg xmlns='http://www.w3.org/2000/svg' style={{ ...style, width: `${width}rem`, height: `${height}rem` }} viewBox={viewBox} fill='currentColor' stroke='none' className={`icon text-${color} ${className}`}>
      {children}
    </svg>
  );
};

const Icon: View<Props> = props => {
  const { name } = props;
  switch (name) {
    case 'chevron-left':
      return (<Feather {...props}><polyline points='15 18 9 12 15 6'></polyline></Feather>);
    case 'calendar':
      return (<Feather {...props}><rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line></Feather>);
    case 'check':
      return (<Feather {...props}><polyline points='20 6 9 17 4 12'></polyline></Feather>);
    case 'help-circle':
      return (<Feather {...props}><circle cx='12' cy='12' r='10'></circle><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'></path><line x1='12' y1='17' x2='12' y2='17'></line></Feather>);
    case 'trash':
      return (<Feather {...props}><polyline points='3 6 5 6 21 6'></polyline><path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path><line x1='10' y1='11' x2='10' y2='17'></line><line x1='14' y1='11' x2='14' y2='17'></line></Feather>);
    case 'paperclip':
      return (<Feather {...props}><path d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'></path></Feather>);
    case 'rfi':
      return (<FontAwesome viewBox='0 0 45 60' {...props}><path d='M23.0461121,42.5777435 C25.3605652,40.6828308 29.381218,41.4421463 30.7793427,44.2371368 C31.0184097,44.7199631 31.4683914,44.9988556 31.9698715,44.9988556 L33.75,44.9988556 C34.7859192,44.9988556 35.625,45.8379364 35.625,46.8738556 C35.625,47.9097748 34.7859192,48.7488556 33.75,48.7488556 L31.9687271,48.7488556 C30.0433731,48.7488556 28.3077621,47.6776886 27.4429321,45.9551239 C27.098465,45.2589798 26.4937592,45.1898575 26.2488556,45.1898575 C26.003952,45.1898575 25.3992462,45.2601242 25.0734329,45.915184 L24.1757584,47.7116776 C23.8570404,48.3503723 23.2054138,48.75 22.4988556,48.75 C22.4554825,48.75 22.4121094,48.7477112 22.3675919,48.7441635 C21.6772842,48.6960983 20.9391403,48.1243515 20.7198715,47.4679184 L18.75,41.5523529 L17.505455,45.2894211 C16.8164062,47.3578262 14.8863602,48.75 12.7043152,48.75 L11.25,48.75 C10.2140808,48.75 9.375,47.9109192 9.375,46.875 C9.375,45.8390808 10.2140808,45 11.25,45 L12.7043152,45 C13.2679367,45 13.7695312,44.6414566 13.9453125,44.1047287 L16.0804367,37.700386 C16.4648437,36.5495682 17.5382996,35.7773209 18.75,35.7773209 C19.9617004,35.7773209 21.0351562,36.550827 21.4195633,37.700386 L23.0461121,42.5777435 Z M43.3394623,11.4820862 C44.3941498,12.5367737 45,13.978157 45,15.4652023 L45,54.3761444 C45,57.4804687 42.472229,60 39.3667603,60 L5.62385559,60 C2.51953125,60 -3.55271368e-15,57.4804687 -3.55271368e-15,54.3761444 L-3.55271368e-15,5.63552856 C-3.55271368e-15,2.53120422 2.51953125,0.0116729736 5.62385559,0 L29.5370865,0 C31.0242462,0 32.4539566,0.597610474 33.5086441,1.65229797 L43.3394623,11.4820862 Z M29.9941635,6.09260559 L29.9941635,15.0082397 L38.9109421,15.0082397 L29.9941635,6.09260559 Z M39.375,54.3761444 L39.375,20.6319809 L27.1828079,20.6319809 C25.6242371,20.6319809 24.3703079,19.3793106 24.3703079,17.8207397 L24.3703079,5.63552856 L5.62385559,5.63552856 L5.62385559,54.3761444 L39.375,54.3761444 Z M10.3125,13.125 C9.79454041,13.125 9.375,12.7054596 9.375,12.1875 L9.375,10.3125 C9.375,9.79454041 9.79454041,9.375 10.3125,9.375 L19.6875,9.375 C20.2054596,9.375 20.625,9.79454041 20.625,10.3125 L20.625,12.1875 C20.625,12.7054596 20.2054596,13.125 19.6875,13.125 L10.3125,13.125 Z M10.3125,20.625 C9.79454041,20.625 9.375,20.2054596 9.375,19.6875 L9.375,17.8125 C9.375,17.2945404 9.79454041,16.875 10.3125,16.875 L19.6875,16.875 C20.2054596,16.875 20.625,17.2945404 20.625,17.8125 L20.625,19.6875 C20.625,20.2054596 20.2054596,20.625 19.6875,20.625 L10.3125,20.625 Z' fill='currentColor' fillRule='nonzero'></path></FontAwesome>);
    case 'matchmaking':
      return (<FontAwesome viewBox='0 0 78 60' {...props}><path d='M71.250877,47.4375262 C73.299958,51.5491595 76.2598579,54.7366333 76.3133508,54.7767857 C77.1570746,55.6741333 77.3847794,56.9866071 76.9026888,58.125 C76.407127,59.2633929 75.295546,60 74.063377,60 C66.8848579,60 61.112458,57.2812762 57.2954937,54.8035976 C54.7508508,55.3928048 52.0722794,55.7142857 49.2865913,55.7142857 C37.7419222,55.7142857 27.8713604,50.3035191 23.6660817,42.6160976 C22.3669484,42.4553571 21.094627,42.2411237 19.862458,41.9597953 C16.0454937,44.4509452 10.2597532,47.1561977 3.09457465,47.1561977 C1.86253642,47.1561977 0.737484108,46.4195905 0.255393567,45.2811977 C-0.240168305,44.1428048 0.000876965512,42.830331 0.844600808,41.9329834 C0.898224552,41.8794904 3.84465312,38.6920166 5.89373411,34.5803833 C2.21069839,30.9375 0.000876965512,26.3839286 0.000876965512,21.4285714 C0.000876965512,9.5892334 12.4695746,0 27.8580198,0 C39.4160294,0 49.3267437,5.42410714 53.5454937,13.1383405 C66.8981984,14.7188023 77.1437341,23.5714286 77.1437341,34.2857143 C77.1437341,39.254412 74.9339127,43.8079834 71.250877,47.4375262 Z M18.6437603,35.0759452 L21.2955198,35.6786237 C23.438377,36.1740548 25.6481984,36.4285714 27.8580198,36.4285714 C39.4696531,36.4285714 49.2865913,29.5580619 49.2865913,21.4285714 C49.2865913,13.299081 39.4696531,6.42857143 27.8580198,6.42857143 C16.2463865,6.42857143 6.42944839,13.299081 6.42944839,21.4285714 C6.42944839,25.2723476 8.59911741,28.2053048 10.4071531,30 L13.7285555,33.28125 L11.6526627,37.4463763 C11.3045007,38.1294904 10.9428674,38.7991333 10.5812341,39.4286237 C12.5365389,38.7455096 14.4651627,37.7811977 16.3535032,36.5625 L18.6437603,35.0759452 Z M66.737458,42.8571429 C68.5454937,41.0624477 70.7151627,38.1294904 70.7151627,34.2857143 C70.7151627,27.6964024 64.2464388,22.03125 55.6213865,20.0892857 C55.6615389,20.5312238 55.7151627,20.973162 55.7151627,21.4285714 C55.7151627,32.2634452 45.2687341,41.1830357 31.701796,42.6294381 C35.5990651,46.5938023 42.0544484,49.2857143 49.2865913,49.2857143 C51.4964127,49.2857143 53.7062341,49.0311977 55.8490913,48.5357666 L58.5143221,47.9196167 L60.8044484,49.4063023 C62.6927889,50.625 64.6214127,51.5893119 66.5767175,52.2722953 C66.215215,51.6428048 65.8535817,50.973162 65.5052889,50.2901786 L63.4293961,46.1250523 L66.737458,42.8571429 Z' fill='currentColor' fillRule='nonzero'></path></FontAwesome>);
    case 'discovery-day':
      return (<FontAwesome viewBox='0 0 53 60' {...props}><path d='M17.652439,33.6585366 L13.0792683,33.6585366 C12.3247398,33.6585366 11.7073171,33.0411139 11.7073171,32.2865854 L11.7073171,27.7134146 C11.7073171,26.9588861 12.3247398,26.3414634 13.0792683,26.3414634 L17.652439,26.3414634 C18.4069675,26.3414634 19.0243902,26.9588861 19.0243902,27.7134146 L19.0243902,32.2865854 C19.0243902,33.0411139 18.4069675,33.6585366 17.652439,33.6585366 Z M30.7317073,32.2865854 C30.7317073,33.0411139 30.1142846,33.6585366 29.3597561,33.6585366 L24.7865854,33.6585366 C24.0320569,33.6585366 23.4146341,33.0411139 23.4146341,32.2865854 L23.4146341,27.7134146 C23.4146341,26.9588861 24.0320569,26.3414634 24.7865854,26.3414634 L29.3597561,26.3414634 C30.1142846,26.3414634 30.7317073,26.9588861 30.7317073,27.7134146 L30.7317073,32.2865854 Z M40.9756098,32.2865854 C40.9756098,33.0411139 40.358187,33.6585366 39.6036585,33.6585366 L35.0304878,33.6585366 C34.2759593,33.6585366 33.6585366,33.0411139 33.6585366,32.2865854 L33.6585366,27.7134146 C33.6585366,26.9588861 34.2759593,26.3414634 35.0304878,26.3414634 L39.6036585,26.3414634 C40.358187,26.3414634 40.9756098,26.9588861 40.9756098,27.7134146 L40.9756098,32.2865854 Z M30.7317073,43.9939024 C30.7317073,44.7484309 30.1142846,45.3658537 29.3597561,45.3658537 L24.7865854,45.3658537 C24.0320569,45.3658537 23.4146341,44.7484309 23.4146341,43.9939024 L23.4146341,39.4207317 C23.4146341,38.6662032 24.0320569,38.0487805 24.7865854,38.0487805 L29.3597561,38.0487805 C30.1142846,38.0487805 30.7317073,38.6662032 30.7317073,39.4207317 L30.7317073,43.9939024 Z M19.0243902,43.9939024 C19.0243902,44.7484309 18.4069675,45.3658537 17.652439,45.3658537 L13.0792683,45.3658537 C12.3247398,45.3658537 11.7073171,44.7484309 11.7073171,43.9939024 L11.7073171,39.4207317 C11.7073171,38.6662032 12.3247398,38.0487805 13.0792683,38.0487805 L17.652439,38.0487805 C18.4069675,38.0487805 19.0243902,38.6662032 19.0243902,39.4207317 L19.0243902,43.9939024 Z M40.9756098,43.9939024 C40.9756098,44.7484309 40.358187,45.3658537 39.6036585,45.3658537 L35.0304878,45.3658537 C34.2759593,45.3658537 33.6585366,44.7484309 33.6585366,43.9939024 L33.6585366,39.4207317 C33.6585366,38.6662032 34.2759593,38.0487805 35.0304878,38.0487805 L39.6036585,38.0487805 C40.358187,38.0487805 40.9756098,38.6662032 40.9756098,39.4207317 L40.9756098,43.9939024 Z M52.6829268,13.125 L52.6829268,54.375 C52.6829268,57.4804687 50.1546167,60 47.0383275,60 L5.6445993,60 C2.5283101,60 1.24344979e-13,57.4804687 1.24344979e-13,54.375 L1.24344979e-13,13.125 C1.24344979e-13,10.0195312 2.5283101,7.5 5.6445993,7.5 L11.2891986,7.5 L11.2891986,1.40625 C11.2891986,0.632858276 11.924262,0 12.7003484,0 L17.4041812,0 C18.1802677,0 18.815331,0.632858276 18.815331,1.40625 L18.815331,7.5 L33.8675958,7.5 L33.8675958,1.40625 C33.8675958,0.632858276 34.5026592,0 35.2787456,0 L39.9825784,0 C40.7586649,0 41.3937282,0.632858276 41.3937282,1.40625 L41.3937282,7.5 L47.0383275,7.5 C50.1546167,7.5 52.6829268,10.0195312 52.6829268,13.125 Z M46.8292683,53.4531451 L46.8292683,19.0243902 L5.85365854,19.0243902 L5.85365854,53.4531451 C5.85365854,53.8343805 6.16798282,54.1463415 6.55210643,54.1463415 L46.1308204,54.1463415 C46.514944,54.1463415 46.8292683,53.8343805 46.8292683,53.4531451 Z' fill='currentColor' fillRule='nonzero'></path></FontAwesome>);
  }
}

export default Icon;
