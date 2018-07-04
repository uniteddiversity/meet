import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';

const isMobileSafari = (userAgent = window.navigator.userAgent) => {
  return /iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent);
};

const getBugs = () => {
  const bugs = {};

  if (isMobileSafari()) {
    // NOTE(longsleep): Mobile Safari plays only a single video element on a page
    // which is not muted. See https://bugs.webkit.org/show_bug.cgi?id=162366 and
    // https://bugs.webkit.org/show_bug.cgi?id=186605 for reference.
    Object.assign(bugs, {cannotPlayMoreThanOneUnmutedVideo: true});
  }

  console.debug('using audio/video bugs list', bugs); // eslint-disable-line no-console
  return bugs;
};
export const bugs = getBugs();

const styles = () => ({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'relative',
    objectFit: 'cover',
    objectPosition: 'center',
    '&::-webkit-media-controls': {
      display: 'none',
    },
    backgroundImage: 'linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black), linear-gradient(45deg, black 25%, transparent 25%, transparent 75%, black 75%, black)',
    backgroundSize: '60px 60px',
    backgroundPosition: '0 0, 30px 30px',
    overflow: 'hidden',
  },
  mirrored: {
    transform: 'scale(-1, 1)',
  },
  blurred: {
    '& > video': {
      filter: 'blur(10px)',
      background: 'white',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      background: 'rgba(255,255,255,0.7)',
    },
  },
  extra: {
    display: 'none',
  },
});

class AudioVideo extends React.PureComponent {
  element = null;
  extra = null;

  constructor(props) {
    super(props);

    this.handleReset = this.handleReset.bind(this);
    this.handleMetadata = this.handleMetadata.bind(this);
  }

  componentDidMount() {
    this.updateStream();
  }

  componentDidUpdate(oldProps) {
    const { stream } = this.props;

    if (stream !== oldProps.stream) {
      if (oldProps.stream) {
        // Remove event handlers from old stream.
        this.removeStreamEvents(oldProps.stream);
      }
      this.updateStream();
    }
  }

  componentWillUnmount() {
    const { stream } = this.props;
    if (stream) {
      this.removeStreamEvents(stream);
    }
  }

  updateStream() {
    const { stream } = this.props;
    if (stream) {
      // Add interesting event handlers.
      this.addStreamEvents(stream);
      this.element.srcObject = stream;
      if (this.extra) {
        this.extra.srcObject = stream;
      }
    } else {
      this.element.src = '';
      if (this.extra) {
        this.extra.src = '';
      }
    }
  }

  addStreamEvents(stream) {
    stream.addEventListener('removetrack', this.handleReset, true);
    stream.addEventListener('addtrack', this.handleReset, true);
  }

  removeStreamEvents(stream) {
    stream.removeEventListener('removetrack', this.handleReset, true);
    stream.removeEventListener('addtrack', this.handleReset, true);
  }

  handleReset() {
    if (this.element) {
      const { stream } = this.props;
      this.element.src = '';
      if (this.extra) {
        this.extra.src = '';
      }
      if (stream) {
        this.element.srcObject = stream;
        if (this.extra) {
          this.extra.srcObject = stream;
        }
      }
    }
  }

  handleMetadata(event) {
    if (event.target instanceof HTMLVideoElement) {
      console.info('video meta data', this.element, event.target.videoWidth, // eslint-disable-line no-console
        event.target.videoHeight);
    } else {
      console.info('audio meta data', this.element);  // eslint-disable-line no-console
    }
  }

  handleElement = (element) => {
    if (element === this.element) {
      return;
    }
    if (this.element) {
      this.element.removeEventListener('loadedmetadata', this.handleMetadata, true);
    }
    this.element = element;
    if (element) {
      this.element.addEventListener('loadedmetadata', this.handleMetadata, true);
    }
  }

  handleExtra = (extra) => {
    if (extra === this.extra) {
      return;
    }

    this.extra = extra;
  }

  render() {
    const {
      classes,
      className: classNameProp,
      children,
      audio,
      mirrored,
      blurred,
      muted,
      conference,
      ...other
    } = this.props;
    delete other.stream;

    const elementClassName = classNames(
      {
        [classes.mirrored]: mirrored,
        [classes.video]: !audio,
      },
    );

    let element;

    if (audio) {
      element = (
        <audio
          className={elementClassName}
          ref={this.handleElement.bind()}
          muted={muted}
          {...other}
        >
          {children}
        </audio>
      );
    } else {
      const withExtra = bugs.cannotPlayMoreThanOneUnmutedVideo && conference;

      const extra = withExtra ? <audio
        className={classes.extra}
        ref={this.handleExtra.bind()}
        autoPlay
        playsInline
        muted={muted}
      /> : null;

      element = (
        <React.Fragment>
          <video
            className={elementClassName}
            ref={this.handleElement.bind()}
            muted={extra ? true : muted}
            {...other}
          >
            {children}
          </video>
          {extra}
        </React.Fragment>
      );
    }

    return (
      <div className={classNames(classes.root, {
        [classes.blurred]: blurred,
      },
      classNameProp)}
      >
        {element}
      </div>
    );
  }
}

AudioVideo.defaultProps = {
  audio: false,
  mirrored: false,
  blurred: false,
  children: null,
  stream: null,

  muted: false,
  autoPlay: true,
  playsInline: true,
};

AudioVideo.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  audio: PropTypes.bool,
  mirrored: PropTypes.bool,
  blurred: PropTypes.bool,
  children: PropTypes.element,
  stream: PropTypes.object,

  muted: PropTypes.bool,
  autoPlay: PropTypes.bool,
  playsInline: PropTypes.bool,

  conference: PropTypes.bool,
};

export default withStyles(styles)(AudioVideo);
