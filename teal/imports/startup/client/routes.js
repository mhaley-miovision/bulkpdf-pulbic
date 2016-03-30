import React from 'react';
import {mount} from 'react-mounter';

import {Layout} from '../../ui/layouts/layout.jsx';

import App from '../../ui/App.jsx'

FlowRouter.route( '/', {
    name: '',
    action() {
        mount(Layout, {
            content: (<App/>)
        })
    }
});

