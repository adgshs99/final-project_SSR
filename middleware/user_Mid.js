function isLogged(req, res, next) {
    const jwtToken = req.cookies.ImLoggedToTasks; // שים לב לשם cookie ייחודי לפרויקט שלך
    if (!jwtToken) {
        return res.redirect('/login');
    }
    jwt.verify(jwtToken, 'myPrivateKey', (err, decodedToken) => {
        if (err) {
            return res.redirect('/login');
        }
        let data = decodedToken.data;
        req.user_id = data.split(",")[0];
        next();
    });
}

module.exports = {
    isLogged
};