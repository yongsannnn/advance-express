const forms = require("forms")

// create some shortcut
const fields = forms.fields;
const validators = forms.validators;
const widget = forms.widgets;

var bootstrapField = function (name, object) {
    if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }

    if (object.widget.classes.indexOf('form-control') === -1) {
        object.widget.classes.push('form-control');
    }

    var validationclass = object.value && !object.error ? 'is-valid' : '';
    validationclass = object.error ? 'is-invalid' : validationclass;
    if (validationclass) {
        object.widget.classes.push(validationclass);
    }

    var label = object.labelHTML(name);
    var error = object.error ? '<div class="invalid-feedback">' + object.error + '</div>' : '';

    var widget = object.widget.toHTML(name, object);
    return '<div class="form-group">' + label + widget + error + '</div>';
};


// categories should be an array of array. 
const createProductForm = (categories, tags) => {
    return forms.create({
        "name": fields.string({
            required: true,
            errorAfterField: true,
            cssClass: {
                label: ["form-label"]
            }
        }),
        "cost": fields.string({
            required: true,
            errorAfterField: true,
            cssClass: {
                label: ["form-label"]
            },
            validators:[validators.integer()]
        }),
        "description": fields.string({
            required: true,
            errorAfterField: true,
            cssClass: {
                label: ["form-label"]
            }
        }),
        "category_id": fields.string({
            label:"Category",
            required: true,
            errorAfterField: true,
            cssClass: ["form-label"],
            widget: widget.select(),
            choices:categories
        }),
        "tags": fields.string({
            required: true,
            errorAfterField: true,
            cssClass: {
                label: ["form-label"]
            },
            widget: widget.multipleSelect(),
            choices: tags
        })
    })
}


module.exports={createProductForm,bootstrapField}