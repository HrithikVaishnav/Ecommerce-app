import React from "react";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";

import Home from "./pages/Home/Home";
import AddProduct from "./pages/admin/Admin";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import Products from './pages/Products/Products';
import Cart from './pages/Cart/Cart';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isAuth: false,
            token: null,
            userId: null,
            isAdmin: false
        };
    }

    /* 
        componentDidMount
        logoutHandler
        loginHandler
        signupHandler
        setAutoLogout 
        Routes 
            - Without Login
            - With Login
    */

    componentDidMount() {
        const token = localStorage.getItem('token');
        const expiryDate = localStorage.getItem('expiryDate');
        if (!token || !expiryDate) {
            return;
        }
        if (new Date(expiryDate) <= new Date()) {
            this.logoutHandler();
            return;
        }
        const userId = localStorage.getItem('userId');
        const isAdmin = localStorage.getItem('isAdmin');
        const remainingMilliseconds = new Date(expiryDate).getTime() - new Date().getTime();
        this.setState({ isAuth: true, token: token, userId: userId, isAdmin: isAdmin });
        this.setAutoLogout(remainingMilliseconds);
    }
    logoutHandler = () => {
        this.setState({ isAuth: false, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('expiryDate');
        localStorage.removeItem('userId');
    };
    loginHandler = (event, authData) => {
        event.preventDefault();
        fetch('http://localhost:4000/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: authData.email,
                password: authData.password
            })
        })
            .then(res => {
                if (res.status !== 200 && res.status !== 201) {
                    console.log('Error!');
                    throw new Error('Could not authenticate you!');
                }
                return res.json();
            })
            .then(resData => {
                console.log(resData);
                this.setState({
                    isAuth: true,
                    token: resData.token,
                    userId: resData.userId,
                    isAdmin: resData.isAdmin
                });
                localStorage.setItem('token', resData.token);
                localStorage.setItem('userId', resData.userId);
                localStorage.setItem('isAdmin', resData.isAdmin);
                const remainingMilliseconds = 60 * 60 * 1000;
                const expiryDate = new Date(
                    new Date().getTime() + remainingMilliseconds
                );
                localStorage.setItem('expiryDate', expiryDate.toISOString());
                this.setAutoLogout(remainingMilliseconds);
            })
            .catch(err => {
                console.log(err);
                this.setState({
                    isAuth: false
                });
            });
    };
    signupHandler = (event, authData) => {
        event.preventDefault();
        fetch('http://localhost:4000/auth/signup', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: authData.email,
                password: authData.password,
                firstName: authData.firstName,
                lastName: authData.lastName,
                contact: authData.contact,
                dob: authData.dob,
                address: authData.address
            })
        })
            .then(res => {
                if (res.status === 422) {
                    throw new Error(
                        "Validation failed. Make sure the email address isn't used yet!"
                    );
                }
                if (res.status !== 200 && res.status !== 201) {
                    console.log('Error!');
                    throw new Error('Creating a user failed!');
                }
                return res.json();
            })
            .then(resData => {
                console.log(resData);
                this.setState({ isAuth: false, userId: resData.userId });
                this.props.history.replace('/');
            })
            .catch(err => {
                console.log(err);
                this.setState({
                    isAuth: false,
                });
            });
    };
    setAutoLogout = milliseconds => {
        setTimeout(() => {
            this.logoutHandler();
        }, milliseconds);
    };

    render() {
        // If not Logged in
        let routes = (
            <Switch>
                <Route
                    path="/"
                    exact
                    render={props => (
                        <Login
                            {...props}
                            onLogin={this.loginHandler}
                        />
                    )}
                />
                <Route
                    path="/signup"
                    exact
                    render={props => (
                        <Signup
                            {...props}
                            onSignup={this.signupHandler}
                        />
                    )}
                />
                <Redirect to="/" />
            </Switch>
        );
        // If Authenticated
        if (this.state.isAuth) {
            routes = (
                <Switch>
                    <Route
                        path="/"
                        exact
                        render={props => (
                            <Home
                                userId={this.state.userId}
                                token={this.state.token}
                                logout={this.logoutHandler}
                                isAdmin={this.state.isAdmin}
                            />
                        )}
                    />
                    <Route
                        path="/admin"
                        exact
                        render={props => (
                            <AddProduct
                                userId={this.state.userId}
                                token={this.state.token}
                                logout={this.logoutHandler}
                            />
                        )}
                    />
                    <Route
                        path="/products"
                        exact
                        render={props => (
                            <Products
                                userId={this.state.userId}
                                token={this.state.token}
                                logout={this.logoutHandler}
                                isAdmin={this.state.isAdmin}
                            />
                        )}
                    />
                    <Route
                        path="/viewcart"
                        exact
                        render={props => (
                            <Cart
                                userId={this.state.userId}
                                token={this.state.token}
                                logout={this.logoutHandler}
                                isAdmin={this.state.isAdmin}
                            />
                        )}
                    />
                </Switch>
            )
        }
        return (
            <Switch>
                {routes}
            </Switch>
        );
    }
}

export default withRouter(App);