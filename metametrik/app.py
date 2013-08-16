from flask import Flask, url_for, render_template
app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
    url_for('static', filename='css/app.css')
    url_for('static', filename='js/app.js')
    url_for('static', filename='js/angular.js')
    url_for('static', filename='js/elastic.js')
    url_for('static', filename='js/elastic-angular-client.js')
    url_for('static', filename='js/controllers.js')
    url_for('static', filename='img/logo.png')
