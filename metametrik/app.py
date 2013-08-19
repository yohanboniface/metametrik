import requests

from flask import Flask, url_for, render_template, request

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/search/papers/paper/_search', methods=['POST'])
def search():
    r = requests.post('http://localhost:9200/papers/paper/_search', data=request.data)
    return r.text


if __name__ == '__main__':
    app.run(debug=True)
    url_for('static', filename='css/app.css')
    url_for('static', filename='js/app.js')
    url_for('static', filename='js/angular.js')
    url_for('static', filename='js/elastic.js')
    url_for('static', filename='js/elastic-angular-client.js')
    url_for('static', filename='js/controllers.js')
    url_for('static', filename='img/logo.png')
